import { Conversation } from "@grammyjs/conversations"
import { deleteTherapyRequest } from "../../api/controllerTherapyRequests/deleteTherapyRequest"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

export const DeleteTherapyRequest: BotConversation = {
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
        console.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result) {
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
