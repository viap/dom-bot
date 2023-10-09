import { Conversation } from "@grammyjs/conversations"
import { deleteTherapySession } from "../../api/controllerTherapySessions/deleteTherapySession"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

export const DeleteTherapySession: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_DELETE
  },

  getConversation(client: ClientDto, session: TherapySessionDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = await conversation.external(async () => {
          return await deleteTherapySession(ctx, session._id)
        })
      } catch (e) {
        console.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result) {
          await ctx.reply("*Сессия удалена*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Сессию удалить не удалось*",
            ReplyMarkup.parseModeV2
          )
        }
      }

      return result
        ? {
            stepsBack: 4,
          }
        : undefined
    }
  },
}