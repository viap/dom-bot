import { addNewClient } from "@/api/controllerPsychologists/addNewClient"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { createForm } from "@/components/Form/form"
import { Conversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"

const clientAdd: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.CLIENT_ADD
  },
  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      await ctx.reply("*Добавление клиента*", {
        ...ReplyMarkup.parseModeV2,
        ...ReplyMarkup.emptyKeyboard,
      })

      const inputs = [
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
          optional: true,
        },
      ] as const

      const form = createForm(conversation, ctx, inputs)
      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false

        try {
          result = await conversation.external(async () => {
            return await addNewClient(ctx, {
              name: formResult.data.name,
              descr: formResult.data.descr,
            })
          })
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
            await ctx.reply("*Добавлен новый клиент*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось добавить клиента*",
              ReplyMarkup.parseModeV2
            )
          }
        }
      }
    }
  },
}

export default clientAdd
