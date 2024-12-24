import { Conversation } from "@grammyjs/conversations"
import { deleteTherapyRequest } from "@/api/controllerTherapyRequests/deleteTherapyRequest"
import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { BotConversation } from "../types/botConversation"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { ConversationResult } from "../types/conversationResult"

const therapyRequestDelete: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_REQUEST_DELETE
  },

  getConversation(therapyRequest: TherapyRequestDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = await conversation.external(async () => {
          return await deleteTherapyRequest(ctx, therapyRequest._id)
        })
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result === true) {
          await ctx.reply("*Заявка удалена*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Заявку удалить не удалось*",
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

export default therapyRequestDelete
