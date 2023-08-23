import { Conversation } from "@grammyjs/conversations"
import { updateTherapyRequest } from "../../api/controllerTherapyRequests/updateTherapyRequest"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"
import { FormInputProps } from "../../components/Form/types/formInputProps"
import { Form } from "../../components/Form/form"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes.enum"
import { getAllPsychologists } from "../../api/controllerPsychologists/getAllPsychologists"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses.enum"

export const TransferTherapyRequest: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_REQUEST_TRANSFER
  },

  getConversation(therapyRequest: TherapyRequestDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const psychologists = await getAllPsychologists(ctx)

      const inputs: Array<FormInputProps> = [
        {
          name: "psychologist",
          alias: "психолог",
          type: FORM_INPUT_TYPES.SELECT,
          values: psychologists
            .filter((psychologist) => {
              return therapyRequest.psychologist
                ? psychologist._id !== therapyRequest.psychologist._id
                : true
            })
            .map((psychologist) => {
              return { text: psychologist.user.name, value: psychologist._id }
            }),
        },
      ]

      type returnType = {
        psychologist: string
      }

      const form = new Form<returnType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        try {
          result = !!(await conversation.external(async () => {
            return await updateTherapyRequest(ctx, therapyRequest._id, {
              psychologist: formResult.data.psychologist,
            })
          }))
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result) {
            await ctx.reply("*Заявка перенаправлена*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось перенаправить заявку*",
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
