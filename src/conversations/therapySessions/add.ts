import { Conversation } from "@grammyjs/conversations"
import { addTherapySession } from "../../api/controllerTherapySessions/addTherapySession"
import { currentUserAlias } from "../../common/consts/currentUserAlias"
import { numberOfCommissionHours } from "../../common/consts/numberOfCommissionHours"
import { therapySessionDurations } from "../../common/consts/therapySessionDurations"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { CURRENCIES } from "../../common/enums/currencies.enum"
import { MyContext } from "../../common/types/myContext"
import { getCurrentDateString } from "../../common/utils/getCurrentDateString"
import { notEmpty } from "../../common/utils/notEmpty"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes.enum"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses.enum"
import { Form } from "../../components/Form/form"
import { FormInputProps } from "../../components/Form/types/formInputProps"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const therapySessionAdd: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_ADD
  },

  getConversation(client: ClientDto, sessions: Array<TherapySessionDto>) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      // NOTICE: how many hours were spent (duration in minutes)
      const commissionHoursSpent =
        sessions.reduce((acc, session) => {
          acc += session.duration
          return acc
        }, 0) / 60
      const commissionHoursLeft = numberOfCommissionHours - commissionHoursSpent
      const shoulPayCommission = commissionHoursLeft > 0

      const inputs: Array<FormInputProps> = [
        // NOTICE: before uncomment need to add date picker
        // {
        //   name: "date",
        //   alias: "Дата",
        //   type: FORM_INPUT_TYPES.STRING,
        // },
        {
          name: "descr",
          alias: "Описание",
          type: FORM_INPUT_TYPES.STRING,
          optional: true,
        },
        {
          name: "duration",
          alias: "Продолжительность",
          type: FORM_INPUT_TYPES.SELECT,
          values: therapySessionDurations,
        },
        {
          name: "priceCurrency",
          alias: "Валюта",
          type: FORM_INPUT_TYPES.SELECT,
          values: Object.values(CURRENCIES),
        },
        {
          name: "priceValue",
          alias: "Цена",
          type: FORM_INPUT_TYPES.FLOAT,
        },
      ]

      type resultType = {
        // date: string
        descr: string
        duration: number
        priceCurrency: CURRENCIES
        priceValue: number
      }
      const form = new Form<resultType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      let result = false
      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        // NOTICE: don't use conversation.now inside of conversation.external !!!!
        const now = await conversation.now()

        const sessionDurationInHours = formResult.data.duration / 60
        const commisionPartOfSession =
          commissionHoursLeft >= sessionDurationInHours
            ? 2 // 50%
            : (sessionDurationInHours / commissionHoursLeft) * 2 // less then 50%
        const commissionHoursSpentForSession =
          sessionDurationInHours > commissionHoursLeft
            ? commissionHoursLeft
            : sessionDurationInHours
        const commissionAmount = shoulPayCommission
          ? Math.floor(formResult.data.priceValue / commisionPartOfSession)
          : 0

        try {
          result = notEmpty(
            await conversation.external(async () => {
              return addTherapySession(ctx, {
                date: getCurrentDateString(now),
                psychologist: currentUserAlias,
                client: client.user._id,
                duration: formResult.data.duration,
                price: {
                  currency: formResult.data.priceCurrency,
                  value: formResult.data.priceValue,
                },
                comission: {
                  currency: formResult.data.priceCurrency,
                  value: commissionAmount,
                },
                descr: formResult.data.descr || undefined,
              })
            })
          )
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result) {
            await ctx.reply("*Добавлена сессия*", ReplyMarkup.parseModeV2)
            if (shoulPayCommission && commissionAmount) {
              await ctx.reply(
                `Комиссия центра (${
                  commissionHoursSpent + commissionHoursSpentForSession
                } из ${numberOfCommissionHours} часов) = ${commissionAmount}${
                  formResult.data.priceCurrency
                }`
              )
            }
          } else {
            await ctx.reply(
              "*Не удалось добавить сессию*",
              ReplyMarkup.parseModeV2
            )
          }
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

export default therapySessionAdd
