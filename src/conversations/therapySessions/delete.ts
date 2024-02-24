import { Conversation } from "@grammyjs/conversations"
import { deleteTherapySession } from "../../api/controllerTherapySessions/deleteTherapySession"
import { oneDayInMilliseconds } from "../../common/consts/oneDayInMilliseconds"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const therapySessionDelete: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_DELETE
  },

  getConversation(session: TherapySessionDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        const deletionIsAvailable =
          Date.now() - session.timestamp < oneDayInMilliseconds * 7

        result = deletionIsAvailable
          ? await conversation.external(async () => {
              return await deleteTherapySession(ctx, session._id)
            })
          : false
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
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

export default therapySessionDelete
