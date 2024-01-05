import { Conversation } from "@grammyjs/conversations"
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

const therapyRequestEdit: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_REQUEST_EDIT
  },

  getConversation(therapyRequest: TherapyRequestDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const inputs: Array<FormInputProps> = [
        {
          name: "name",
          alias: "имя",
          default: therapyRequest.name,
          optional: true,
          type: FORM_INPUT_TYPES.STRING,
        },
        {
          name: "descr",
          alias: "запрос",
          default: therapyRequest.descr,
          optional: true,
          type: FORM_INPUT_TYPES.STRING,
        },
      ]

      type returnType = {
        name: string
        descr: string
      }

      const form = new Form<returnType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        try {
          result = notEmpty(
            await conversation.external(async () => {
              return await updateTherapyRequest(ctx, therapyRequest._id, {
                name: formResult.data.name,
                descr: formResult.data.descr,
              })
            })
          )
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result) {
            await ctx.reply("*Заявка изменена*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось изменить заявку*",
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

export default therapyRequestEdit
