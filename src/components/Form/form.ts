import { Conversation } from "@grammyjs/conversations"
import { Keyboard } from "grammy"
import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from "grammy/types"
import { MyContext } from "../../common/types/myContext"
import { ObjectWithPrimitiveValues } from "../../common/types/objectWithPrimitiveValues"
import { PrimitiveValues } from "../../common/types/primitiveValues"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { defaultButtonsRow } from "./consts/defaultButtonsRow"
import { defaultTexts } from "./consts/defaultTexts"
import { FORM_BUTTON_ACTIONS } from "./enums/formButtonActions.enum"
import { FORM_INPUT_TYPES } from "./enums/formInputTypes.enum"
import { FORM_RESULT_STATUSES } from "./enums/formResultStatuses.enum"
import { FORM_TEXT_TYPES } from "./enums/formTextTypes.enum"
import { FormButtonProps } from "./types/formButtonProps"
import { FormInputProps } from "./types/formInputProps"
import { FormOptions } from "./types/formOptions"
import { FormResultProps } from "./types/formResultProps"
import { inputValueToString } from "./utils/inputValueToString"
import { FromInputValue } from "./types/formInputValue"

export class Form<T extends ObjectWithPrimitiveValues> {
  private status: FORM_RESULT_STATUSES
  private data: T
  private inputIndex: number
  private keyboard?: Keyboard

  constructor(
    private conversation: Conversation<MyContext>,
    private ctx: MyContext,
    private inputs: Array<FormInputProps>,
    private options: FormOptions = { texts: defaultTexts },
    private buttonRows: Array<Array<FormButtonProps>> = defaultButtonsRow
  ) {
    this.inputIndex = -1
    this.status = FORM_RESULT_STATUSES.INITED
    this.data = {} as T

    this.refreshKeyboardButtons()
  }

  private refreshKeyboardButtons() {
    this.keyboard = new Keyboard(this.availableKeyboardButtons).resized(true)
  }

  private get availableKeyboardButtons() {
    return this.buttonRows.map((row) => {
      return row
        .filter((button) => {
          switch (button.action) {
            case FORM_BUTTON_ACTIONS.PREV:
              return !!this.prevInput
            case FORM_BUTTON_ACTIONS.NEXT:
              return !!(this.input && this.input.optional)
            default:
              return true
          }
        })
        .map((button) => {
          let text = button.text
          switch (button.action) {
            case FORM_BUTTON_ACTIONS.PREV:
              if (this.prevInput)
                text = `${text} ${
                  this.prevInput.alias || this.prevInput.name || "Завершить"
                }`
              break
            case FORM_BUTTON_ACTIONS.NEXT:
              if (this.nextInput)
                text = `${
                  this.nextInput.alias || this.nextInput.name || "Завершить"
                } ${text}`
              break
          }
          return {
            ...button,
            text,
          }
        })
    })
  }

  private getButtonAction(text: string): FormButtonProps | undefined {
    for (const row of this.availableKeyboardButtons) {
      for (const button of row) {
        if (button.text === text) {
          return button
        }
      }
    }
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
      await this.ctx.reply(text, { ...replyProps, ...ReplyMarkup.parseModeV2 })
    }
  }

  get input(): FormInputProps | undefined {
    return this.inputs[this.inputIndex]
  }

  get nextInput(): FormInputProps | undefined {
    return this.inputs[this.inputIndex + 1]
  }

  get prevInput(): FormInputProps | undefined {
    return this.inputs[this.inputIndex - 1]
  }

  async requestData() {
    return this.requestInputs()
  }

  private async requestInputs() {
    if (
      [FORM_RESULT_STATUSES.INITED, FORM_RESULT_STATUSES.IN_PROGRESS].includes(
        this.status
      )
    ) {
      this.status = FORM_RESULT_STATUSES.IN_PROGRESS
      this.inputIndex++
      // this.input = inputs.shift()
      this.refreshKeyboardButtons()

      if (this.input) {
        // TODO: move this logic into refreshKeyboardButtons or SLT
        const selectKeyboard =
          this.input.values && this.input.values.length > 0
            ? new Keyboard(
                this.input.values.map((value) => [inputValueToString(value)])
              )
            : undefined

        const curKeyboard = selectKeyboard
          ? this.keyboard
            ? selectKeyboard.append(this.keyboard)
            : selectKeyboard
          : this.keyboard
          ? this.keyboard
          : undefined

        await this.showText(
          FORM_TEXT_TYPES.BEFORE_INPUT,
          curKeyboard
            ? ReplyMarkup.keyboard(curKeyboard)
            : ReplyMarkup.emptyKeyboard
        )

        this.ctx = await this.conversation.waitFor("message:text")
        const text = this.ctx.msg?.text || ""
        const buttonAction = this.getButtonAction(text)

        this.conversation.log("text", text)
        this.conversation.log("buttonAction", buttonAction)

        if (buttonAction) {
          switch (buttonAction.action) {
            case FORM_BUTTON_ACTIONS.PREV:
              this.inputIndex -= 2
              break
            case FORM_BUTTON_ACTIONS.NEXT:
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
          if (!this.validateInput(text, this.input)) {
            await this.ctx.reply(
              this.getValidationErrorMessage(text, this.input)
            )
            this.inputIndex--
          } else {
            this.data = {
              ...this.data,
              [this.input.name]: this.convertValue(text, this.input),
            } as T

            await this.showText(
              FORM_TEXT_TYPES.AFTER_INPUT,
              this.keyboard
                ? ReplyMarkup.keyboard(this.keyboard)
                : ReplyMarkup.emptyKeyboard
            )
          }
        }
        await this.requestInputs()
      } else {
        this.status = FORM_RESULT_STATUSES.FINISHED
      }
    }

    return {
      status: this.status,
      data: this.data,
    } as FormResultProps<T>
  }

  private validateInput(text: string, input: FormInputProps): boolean {
    switch (input.type) {
      case FORM_INPUT_TYPES.STRING:
        return typeof text === "string" && text.length > 0
      case FORM_INPUT_TYPES.NUMBER:
        return !isNaN(parseInt(text))
      case FORM_INPUT_TYPES.FLOAT:
        return !isNaN(parseFloat(text))
      case FORM_INPUT_TYPES.BOOLEAN:
        return Boolean(text)
      case FORM_INPUT_TYPES.SELECT:
        return (input.values || [])
          .map(inputValueToString)
          .includes(text.toString())
    }
  }

  private convertValue(text: string, input: FormInputProps): PrimitiveValues {
    let res = undefined
    switch (input.type) {
      case FORM_INPUT_TYPES.STRING:
        return text
      case FORM_INPUT_TYPES.NUMBER:
        return parseInt(text)
      case FORM_INPUT_TYPES.FLOAT:
        return parseFloat(text)
      case FORM_INPUT_TYPES.BOOLEAN:
        return Boolean(text)
      case FORM_INPUT_TYPES.SELECT:
        res = (input.values || []).find((value) => {
          return inputValueToString(value) === text
        }) as FromInputValue
        return typeof res === "object" ? res.value : res
    }
  }

  private getValidationErrorMessage(
    text: string,
    input: FormInputProps
  ): string {
    switch (input.type) {
      case FORM_INPUT_TYPES.STRING:
        return "Должна быть не пустая строка"
      case FORM_INPUT_TYPES.FLOAT:
        return "Должно быть целое или дробное число"
      case FORM_INPUT_TYPES.NUMBER:
        return "Должно быть целое число"
      case FORM_INPUT_TYPES.BOOLEAN:
        return "Должно быть 'да' или 'нет'"
      case FORM_INPUT_TYPES.SELECT:
        return "Выберите значение из списка"
    }
  }
}
