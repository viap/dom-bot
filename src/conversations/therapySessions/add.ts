import { Conversation } from "@grammyjs/conversations"
import { addTherapySession } from "@/api/controllerTherapySessions/addTherapySession"
import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { numberOfCommissionHours } from "@/common/consts/numberOfCommissionHours"
import { therapySessionDurations } from "@/common/consts/therapySessionDurations"
import { ClientDto } from "@/common/dto/client.dto"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { CURRENCIES } from "@/common/enums/currencies"
import { getTextOfTherapySession } from "@/common/texts/getTextOfTherapySession"
import { MyContext } from "@/common/types/myContext"
import { getLocalDateString } from "@/common/utils/getLocalDateString"
import { notEmpty } from "@/common/utils/notEmpty"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { Form } from "@/components/Form/form"
import { FormInputProps } from "@/components/Form/types/formInputProps"
import { parseRuDate } from "@/common/utils/parseRuDate"
import { BotConversation, ConversationResult } from "../types"
import { CONVERSATION_NAMES } from "../enums/conversationNames"

const therapySessionAdd: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_ADD
  },

  getConversation(client: ClientDto, sessions: Array<TherapySessionDto>) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined | unknown> => {
      // NOTICE: don't use conversation.now inside of conversation.external
      const now = await conversation.now()

      // NOTICE: how many hours were spent (duration in minutes)
      const commissionHoursSpent =
        sessions.reduce((acc, session) => {
          acc += session.duration
          return acc
        }, 0) / 60
      const commissionHoursLeft = numberOfCommissionHours - commissionHoursSpent
      const shoulPayCommission = commissionHoursLeft > 0

      const theLastSession: TherapySessionDto | undefined = sessions
        .filter((session) => session.client._id === client.user._id)
        .sort(
          (session1, session2) => session2.timestamp - session1.timestamp
        )[0]

      const inputs: Array<FormInputProps> = [
        {
          name: "date",
          alias: "Дата",
          type: FORM_INPUT_TYPES.DATE,
          default: getLocalDateString(now),
          calendarOptions: {
            stop_date: "now",
          },
        },
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
          default: theLastSession
            ? therapySessionDurations.find(
                (item) => item.value === theLastSession.duration
              )?.text
            : undefined,
        },
        {
          name: "priceCurrency",
          alias: "Валюта",
          type: FORM_INPUT_TYPES.SELECT,
          values: Object.values(CURRENCIES),
          default: theLastSession
            ? Object.values(CURRENCIES).find(
                (item) => item === theLastSession.price.currency
              )
            : undefined,
        },
        {
          name: "priceValue",
          alias: "Цена",
          type: FORM_INPUT_TYPES.FLOAT,
          default: theLastSession?.price.value.toString(),
        },
      ]

      type resultType = {
        date: string
        descr: string
        duration: number
        priceCurrency: CURRENCIES
        priceValue: number
      }
      const form = new Form<resultType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      let result = false
      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        const sessionDurationInHours = formResult.data.duration / 60
        const commisionPartOfSession =
          commissionHoursLeft >= sessionDurationInHours
            ? 2 // 50%
            : (sessionDurationInHours / commissionHoursLeft) * 2 // less then 50%
        const commissionAmount = shoulPayCommission
          ? Math.floor(formResult.data.priceValue / commisionPartOfSession)
          : 0

        let addedSession: TherapySessionDto | undefined = undefined
        try {
          addedSession = await conversation.external(async () => {
            return addTherapySession(ctx, {
              dateTime: parseRuDate(formResult.data.date) || Date.now(),
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

          result = notEmpty(addedSession)
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
            await ctx.reply("*Добавлена сессия*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось добавить сессию*",
              ReplyMarkup.parseModeV2
            )
          }
        }

        if (addedSession) {
          await ctx.reply(
            getTextOfTherapySession(addedSession),
            ReplyMarkup.parseModeV2
          )
          // const conv: BotConversation | undefined = BotConversations.getByName(
          //   CONVERSATION_NAMES.THERAPY_SESSION_SHOW
          // )

          // if (conv) {
          //   return await conv.getConversation(...[client, addedSession])(
          //     conversation,
          //     ctx
          //   )
          // }
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
