import { Conversation } from "@grammyjs/conversations"
import { ConversationResult, BotConversation } from "../types"
import { acceptTherapyRequest } from "@/api/controllerTherapyRequests/acceptTherapyRequest"
import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"

const therapyRequestAccept: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_REQUEST_ACCEPT
  },
  getConversation(therapyRequest: TherapyRequestDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result: boolean | undefined = false

      try {
        result = await conversation.external(async () => {
          return await acceptTherapyRequest(ctx, therapyRequest._id)
        })
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result === true) {
          await ctx.reply("*Заявка принята*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Не удалось принять заявку*",
            ReplyMarkup.parseModeV2
          )
        }
      }

      return result ? { stepsBack: 2 } : undefined
    }
  },
}

export default therapyRequestAccept
