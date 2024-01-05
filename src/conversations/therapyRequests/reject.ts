import { Conversation } from "@grammyjs/conversations"
import { rejectTherapyRequest } from "../../api/controllerTherapyRequests/rejectTherapyRequest"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "conversations/types/conversationResult"

const therapyRequestReject: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_REQUEST_REJECT
  },
  getConversation(therapyRequest: TherapyRequestDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result: boolean | undefined = false

      try {
        result = await conversation.external(async () => {
          return await rejectTherapyRequest(ctx, therapyRequest._id)
        })
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result) {
          await ctx.reply("*Заявка отклонена*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Не удалось отклонить заявку*",
            ReplyMarkup.parseModeV2
          )
        }
      }

      return result ? { stepsBack: 2 } : undefined
    }
  },
}

export default therapyRequestReject
