import { Conversation } from "@grammyjs/conversations"
import { getAllPsychologists } from "../../api/controllerPsychologists/getAllPsychologists"
import { updateTherapyRequest } from "../../api/controllerTherapyRequests/updateTherapyRequest"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors"
import { MyContext } from "../../common/types/myContext"
import { notEmpty } from "../../common/utils/notEmpty"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses"
import { Form } from "../../components/Form/form"
import { FormInputProps } from "../../components/Form/types/formInputProps"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const therapyRequestTransfer: BotConversation = {
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
          result = notEmpty(
            await conversation.external(async () => {
              return await updateTherapyRequest(ctx, therapyRequest._id, {
                psychologist: formResult.data.psychologist,
              })
            })
          )
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
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
              stepsBack: 3,
            }
          : undefined
      }
    }
  },
}

export default therapyRequestTransfer
