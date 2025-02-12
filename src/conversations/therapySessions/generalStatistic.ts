import { Conversation } from "@grammyjs/conversations"
import { getStatisticForPeriod } from "@/api/controllerTherapySessions/getStatisticForPeriod"
import { numberOfCommissionHours } from "@/common/consts/numberOfCommissionHours"
import { PriceDto } from "@/common/dto/price.dto"
import { TherapySessionsStatisticDto } from "@/common/dto/therapySessionsStatistic.dto"
import { PERIODS } from "@/common/enums/periods"
import { MyContext } from "@/common/types/myContext"
import { getLocalDateString } from "@/common/utils/getLocalDateString"
import { getSumsForPrices } from "@/common/utils/getSumsForPrices"
import { getTimeRange } from "@/common/utils/getTimeRange"
import { groupBy } from "@/common/utils/groupBy"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { Form } from "@/components/Form/form"
import { FormInputProps } from "@/components/Form/types/formInputProps"
import { getDateFromRuDateString } from "@/common/utils/getDateFromRuDateString"
import { BotConversation } from "../types/botConversation"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { ConversationResult } from "../types/conversationResult"

const therapySessionsGeneralStatistic: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC
  },

  getConversation(period?: PERIODS) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const [startDate, endDate] = period
        ? getTimeRange(period)
        : await selectPeriod(conversation, ctx)

      if (!(startDate instanceof Date && endDate instanceof Date)) {
        return
      }

      const datesOfPeriod = ReplyMarkup.escapeForParseModeV2(
        `${startDate.toLocaleDateString("ru")} - ${endDate.toLocaleDateString(
          "ru"
        )}`
      )
      await ctx.reply(
        `*Статистика за период:* ${datesOfPeriod}`,
        ReplyMarkup.parseModeV2
      )

      const sessionsStatistic: Array<TherapySessionsStatisticDto> =
        await getStatisticForPeriod(ctx, {
          from: startDate.getTime(),
          to: endDate.getTime(),
        })

      if (sessionsStatistic.length) {
        const sessionsByPsychologist = groupBy(
          sessionsStatistic,
          (item) => item.psychologist._id
        )

        const fullComissions: Array<PriceDto> = []
        const content: Array<string> = []
        Object.entries(sessionsByPsychologist).forEach(
          ([, sessions]: [string, Array<TherapySessionsStatisticDto>]) => {
            const psychologistName = sessions[0]?.psychologist?.user?.name || ""
            content.push(`*${psychologistName}*`)

            const comissionSumm = sessions.reduce((acc, stat, index) => {
              content.push(
                ReplyMarkup.escapeForParseModeV2(
                  `${index + 1}. ${stat.client.name}: сессий - ${
                    stat.countForPeriod
                  }, всего - ${
                    stat.countAll
                  }/${numberOfCommissionHours}, комиссия - ${getSumsForPrices(
                    stat.comission
                  ).join(", ")};`
                )
              )

              acc.push(...stat.comission)
              return acc
            }, [] as Array<PriceDto>)

            fullComissions.push(...comissionSumm)

            content.push(
              `Комиссия за период: *${getSumsForPrices(comissionSumm).join(
                ", "
              )}*${ReplyMarkup.newLine}`
            )
          }
        )

        if (fullComissions.length) {
          content.push(
            `Общая комиссия за период: *${getSumsForPrices(fullComissions).join(
              ", "
            )}*`
          )
        }

        await ctx.reply(
          content.join(ReplyMarkup.newLine),
          ReplyMarkup.parseModeV2
        )
      } else {
        await ctx.reply("*Записей нет*", ReplyMarkup.parseModeV2)
      }

      return
    }
  },
}

async function selectPeriod(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<[Date, Date] | [undefined, undefined]> {
  const now = await conversation.now()
  const inputs: Array<FormInputProps> = [
    {
      name: "startDate",
      alias: "Начальная дата",
      type: FORM_INPUT_TYPES.DATE,
      calendarOptions: {
        stop_date: "now",
      },
    },
    {
      name: "endDate",
      alias: "Конечная дата",
      type: FORM_INPUT_TYPES.DATE,
      default: getLocalDateString(now),
      calendarOptions: {
        stop_date: "now",
      },
    },
  ]

  type resultType = {
    startDate: string
    endDate: string
  }
  const form = new Form<resultType>(conversation, ctx, inputs)
  const formResult = await form.requestData()

  if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
    return [
      getDateFromRuDateString(formResult.data.startDate),
      getDateFromRuDateString(formResult.data.endDate),
    ]
  }

  return [undefined, undefined]
}

export default therapySessionsGeneralStatistic
