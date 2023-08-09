import { Conversation } from "@grammyjs/conversations"
import { Keyboard } from "grammy"
import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from "grammy/types"
import { MyContext } from "types/myContext"
import { addMyNewClient } from "../api/addMyNewClient"
import { ReplyMarkup } from "../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"

export const AddClient = {
  getName() {
    return CONVERSATION_NAMES.ADD_CLIENT
  },
  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      await ctx.reply("*Добавление клиента*", {
        ...ReplyMarkup.parseModeV2,
        ...ReplyMarkup.emptyKeyboard,
      })

      const form = new Form<{ name: string; descr: string }>(
        conversation,
        ctx,
        {
          texts: {
            beforeInput: (data, input: FormInputProps) => {
              return `Введите ${(input.alias || input.name).toUpperCase()} ${
                input.owner && `для ${input.owner.toUpperCase()}`
              }`
            },
          },
        },
        [
          {
            name: "name",
            alias: "имя",
            type: FORM_INPUT_TYPES.STRING,
            owner: "клиентa",
          },
          {
            name: "descr",
            alias: "описание",
            type: FORM_INPUT_TYPES.STRING,
            owner: "клиентa",
          },
        ],
        [
          [
            {
              text: "Назад",
              action: FORM_BUTTON_ACTIONS.BACK,
              callback: async () => {
                conversation.log("Нажали назад")
              },
            },
            {
              text: "Отмена",
              action: FORM_BUTTON_ACTIONS.REJECT,
              callback: async () => {
                conversation.log("Нажали отмена")
              },
            },
          ],
        ]
      )

      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        const result = await addMyNewClient(ctx, {
          name: formResult.data.name,
          descr: formResult.data.descr,
        })
        if (result) {
          await ctx.reply("*Добавлен новый клиент*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Не удалось добавить клиента*",
            ReplyMarkup.parseModeV2
          )
        }
      }
    }
  },
}

enum FORM_INPUT_TYPES {
  FLOAT = "float",
  NUMBER = "number",
  STRING = "string",
  BOOLEAN = "boolean",
  // SELECT = "select",
}

enum FORM_RESULT_STATUSES {
  INITED = "inited",
  IN_PROGRESS = "in_progress",
  FINISHED = "finished",
  REJECTED = "rejected",
}

enum FORM_BUTTON_ACTIONS {
  BACK = "back",
  REJECT = "reject",
}

type FormResultPops<T> =
  | {
      status: FORM_RESULT_STATUSES.FINISHED
      data: T
    }
  | {
      status: FORM_RESULT_STATUSES.IN_PROGRESS | FORM_RESULT_STATUSES.REJECTED
      data: Partial<T>
    }

type FormButtonPops = {
  text: string
  action: FORM_BUTTON_ACTIONS
  callback?: (
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) => void | Promise<void>
}

type FormInputProps = {
  name: string
  type: FORM_INPUT_TYPES
  alias?: string
  owner?: string
}

enum FORM_TEXT_TYPES {
  BEFORE_INPUT = "beforeInput",
  AFTER_INPUT = "afterInput",
  AFTER_REJECT = "afterReject",
}

type FormOptions = {
  texts?: {
    [FORM_TEXT_TYPES.BEFORE_INPUT]?: (
      data: ObjectPrimitiveValues,
      input: FormInputProps
    ) => string | string
    [FORM_TEXT_TYPES.AFTER_INPUT]?: (
      data: ObjectPrimitiveValues,
      input: FormInputProps
    ) => string | string
    [FORM_TEXT_TYPES.AFTER_REJECT]?: (
      data: ObjectPrimitiveValues
    ) => string | string
  }
}

type PrimitiveValues = number | string | boolean
type ObjectPrimitiveValues = { [key: string]: PrimitiveValues }

export class Form<T extends ObjectPrimitiveValues> {
  private status: FORM_RESULT_STATUSES
  private data: T
  private input?: FormInputProps
  private keyboard?: Keyboard
  private hasPreviousProp: boolean

  constructor(
    private conversation: Conversation<MyContext>,
    private ctx: MyContext,
    private options: FormOptions,
    private inputs: Array<FormInputProps>,
    private buttonRows: Array<Array<FormButtonPops>> = [[]]
  ) {
    this.hasPreviousProp = false
    this.status = FORM_RESULT_STATUSES.INITED
    this.data = {} as T
    this.buttonRows = buttonRows

    this.refreshKeyboardButtons()
  }

  private refreshKeyboardButtons() {
    this.keyboard = new Keyboard(this.availableKeyboardButtons()).resized(true)
  }

  private availableKeyboardButtons() {
    return this.buttonRows.map((row) => {
      return row.filter((button) => {
        return !(
          !this.hasPreviousProp && button.action === FORM_BUTTON_ACTIONS.BACK
        )
      })
    })
  }

  private getButtonAction(text: string): FormButtonPops | undefined {
    for (const row of this.availableKeyboardButtons()) {
      for (const button of row) {
        if (button.text === text) {
          return button
        }
      }
    }
  }

  async requestData() {
    return await this.requestInputs()
  }

  private async showText(
    type: FORM_TEXT_TYPES,
    replyProps: { reply_markup: ReplyKeyboardMarkup | ReplyKeyboardRemove }
  ) {
    let text
    let textProp = this.options.texts?.[type] || ""
    switch (type) {
      case FORM_TEXT_TYPES.AFTER_INPUT:
      case FORM_TEXT_TYPES.BEFORE_INPUT:
        textProp = this.options.texts?.[type] || ""
        text =
          typeof textProp === "string"
            ? textProp
            : this.input
            ? textProp(this.data, this.input)
            : ""
        break
      case FORM_TEXT_TYPES.AFTER_REJECT:
        textProp = this.options.texts?.[type] || ""
        text =
          typeof textProp === "string"
            ? textProp
            : textProp(this.data, {} as FormInputProps)
        break
    }

    if (text) {
      await this.ctx.reply(text, replyProps)
    }
  }

  private async requestInputs(leftProps?: Array<FormInputProps>) {
    let inputs = leftProps || [...this.inputs]

    this.hasPreviousProp = !(inputs.length === this.inputs.length)
    this.refreshKeyboardButtons()

    if (
      [FORM_RESULT_STATUSES.INITED, FORM_RESULT_STATUSES.IN_PROGRESS].includes(
        this.status
      )
    ) {
      this.status = FORM_RESULT_STATUSES.IN_PROGRESS
      this.input = inputs.shift()

      if (this.input) {
        await this.showText(
          FORM_TEXT_TYPES.BEFORE_INPUT,
          this.keyboard
            ? ReplyMarkup.keyboard(this.keyboard)
            : ReplyMarkup.emptyKeyboard
        )

        this.ctx = await this.conversation.waitFor("message:text")
        const text = this.ctx.msg?.text || ""
        const buttonAction = this.getButtonAction(text)

        this.conversation.log("text", text)
        this.conversation.log("buttonAction", buttonAction)

        if (buttonAction) {
          switch (buttonAction.action) {
            case FORM_BUTTON_ACTIONS.BACK:
              if (inputs.length < this.inputs.length - 1) {
                inputs = this.inputs.slice(-1 * (inputs.length + 2))
              }
              break
            case FORM_BUTTON_ACTIONS.REJECT:
              this.status = FORM_RESULT_STATUSES.REJECTED

              await this.showText(
                FORM_TEXT_TYPES.AFTER_REJECT,
                this.keyboard
                  ? ReplyMarkup.keyboard(this.keyboard)
                  : ReplyMarkup.emptyKeyboard
              )

              break
          }

          if (buttonAction.callback) {
            await buttonAction.callback(this.conversation, this.ctx)
          }
        } else {
          if (!this.validateInput(text, this.input.type)) {
            await this.ctx.reply(
              this.getValidationErrorMessage(text, this.input.type)
            )
            inputs.unshift(this.input)
          } else {
            this.data = {
              ...this.data,
              [this.input.name]: this.convertValue(text, this.input.type),
            } as T

            await this.showText(
              FORM_TEXT_TYPES.AFTER_INPUT,
              this.keyboard
                ? ReplyMarkup.keyboard(this.keyboard)
                : ReplyMarkup.emptyKeyboard
            )
          }
        }
        await this.requestInputs(inputs)
      } else {
        this.status = FORM_RESULT_STATUSES.FINISHED
      }
    }

    return {
      status: this.status,
      data: this.data,
    } as FormResultPops<T>
  }

  private validateInput(input: string, type: FORM_INPUT_TYPES): boolean {
    switch (type) {
      case FORM_INPUT_TYPES.STRING:
        return typeof input === "string" && input.length > 0
      case FORM_INPUT_TYPES.NUMBER:
        return !isNaN(parseInt(input))
      case FORM_INPUT_TYPES.FLOAT:
        return !isNaN(parseFloat(input))
      case FORM_INPUT_TYPES.BOOLEAN:
        return Boolean(input)
    }
  }

  private convertValue(input: string, type: FORM_INPUT_TYPES): PrimitiveValues {
    switch (type) {
      case FORM_INPUT_TYPES.STRING:
        return input
      case FORM_INPUT_TYPES.NUMBER:
        return parseInt(input)
      case FORM_INPUT_TYPES.FLOAT:
        return parseFloat(input)
      case FORM_INPUT_TYPES.BOOLEAN:
        return Boolean(input)
    }
  }

  private getValidationErrorMessage(
    input: string,
    type: FORM_INPUT_TYPES
  ): string {
    switch (type) {
      case FORM_INPUT_TYPES.STRING:
        return "Должна быть не пустая строка"
      case FORM_INPUT_TYPES.FLOAT:
        return "Должно быть целое или дробное число"
      case FORM_INPUT_TYPES.NUMBER:
        return "Должно быть целое число"
      case FORM_INPUT_TYPES.BOOLEAN:
        return "Должно быть 'да' или 'нет'"
    }
  }
}
