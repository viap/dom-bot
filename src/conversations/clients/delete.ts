import { Conversation } from "@grammyjs/conversations"
import { deleteClient } from "../../api/controllerPsychologists/deleteClient"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"
import { BOT_ERRORS } from "../../common/enums/botErrors"

const clientDelete: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.CLIENT_DELETE
  },

  getConversation(client: ClientDto, _sessions: Array<TherapySessionDto>) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = await conversation.external(async () => {
          return await deleteClient(ctx, client.user._id)
        })
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result === true) {
          await ctx.reply("*Клиент удален*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Клиента удалить не удалось*",
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
  },
}

export default clientDelete
