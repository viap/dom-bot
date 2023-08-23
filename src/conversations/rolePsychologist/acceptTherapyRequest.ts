import { Conversation } from "@grammyjs/conversations"
import { addNewClient } from "../../api/controllerPsychologists/addNewClient"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes.enum"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses.enum"
import { Form } from "../../components/Form/form"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { acceptTherapyRequest } from "../../api/controllerTherapyRequests/acceptTherapyRequest"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { ConversationResult } from "conversations/types/conversationResult"

export const AcceptTherapyRequest: BotConversation = {
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
        if (result) {
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
