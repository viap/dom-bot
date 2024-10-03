import { Conversation } from "@grammyjs/conversations"
import { editClient } from "../../api/controllerPsychologists/editClient"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses"
import { Form } from "../../components/Form/form"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const clientEdit: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.CLIENT_EDIT
  },

  getConversation(client: ClientDto, _sessions: Array<TherapySessionDto>) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const inputs = [
        {
          name: "descr",
          alias: "описание",
          type: FORM_INPUT_TYPES.STRING,
          owner: client.user.name,
        },
      ]
      type resultType = { descr: string }
      const form = new Form<resultType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      const clientResult = { ...client }
      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        try {
          result = await conversation.external(async () => {
            return await editClient(ctx, client.user._id, {
              descr: formResult.data.descr,
            })
          })
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
            Object.assign(clientResult, formResult.data)
            await ctx.reply("*Описание изменено*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось изменить описание*",
              ReplyMarkup.parseModeV2
            )
          }
        }

        return result
          ? {
              stepsBack: 2,
            }
          : undefined
      }
    }
  },
}

export default clientEdit
