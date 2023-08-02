import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { SessionData } from "../../types/sessionData"
import { MyContext } from "types/myContext"
import { ReplyMarkup } from "../../common/consts/replyMarkup"

export class AddClient<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  // constructor() {}

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      await ctx.reply("Добавление клиента".toUpperCase(), {
        reply_markup: ReplyMarkup.emptyKeyboard,
      })

      const form = new Form(conversation, ctx, [
        {
          name: "name",
          alias: "имя",
          type: FormInputTypes.STRING,
          owner: "клиентa",
        },
        {
          name: "descr",
          alias: "описание",
          type: FormInputTypes.STRING,
          owner: "клиентa",
        },
      ])

      const result = await form.requestData()
      await ctx.reply("Добавлен новый клиент")
      await ctx.reply(JSON.stringify(result))
    }
  }
}

enum FormInputTypes {
  NUMBER,
  STRING,
  BOOLEAN,
}

type FormInputProps = {
  name: string
  type: FormInputTypes
  alias?: string
  owner?: string
}

export class Form {
  private userInput: { [key: string]: number | string | boolean }

  constructor(
    private conversation: Conversation<MyContext>,
    private ctx: MyContext,
    private props: Array<FormInputProps>
  ) {
    this.userInput = {}
  }

  async requestData() {
    return await this.requestInputs()
  }

  private async requestInputs(leftProps?: Array<FormInputProps>) {
    const props = leftProps || [...this.props]
    const prop = props.shift()

    if (prop) {
      await this.ctx.reply(
        `Введите ${(prop.alias || prop.name).toUpperCase()} ${
          prop.owner && `для ${prop.owner.toUpperCase()}`
        }`
      )
      const result = await this.conversation.waitFor("message:text")

      const isCorrectInput = !!result.msg.text
      if (!isCorrectInput) {
        await this.ctx.reply("Данные введены не правильноб попробуйте еще раз")
        props.unshift(prop)
      } else {
        this.userInput[prop.name] = result.msg.text
      }
      await this.requestInputs(props)
    }

    return this.userInput
  }
}
