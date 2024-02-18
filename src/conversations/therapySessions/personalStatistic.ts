import { Conversation } from "@grammyjs/conversations"
import { getStatisticForPeriod } from "../../api/controllerTherapySessions/getStatisticForPeriod"
import { getTherapySessions } from "../../api/controllerTherapySessions/getTherapySessions"
import { PriceDto } from "../../common/dto/price.dto"
import { TherapySessionsStatisticDto } from "../../common/dto/therapySessionsStatistic.dto"
import { PERIODS } from "../../common/enums/periods"
import { MyContext } from "../../common/types/myContext"
import { getSumsForPrices } from "../../common/utils/getSumsForPrices"
import { getTextOfData } from "../../common/utils/getTextOfData"
import { getTimeRange } from "../../common/utils/getTimeRange"
import { groupBy } from "../../common/utils/groupBy"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const therapySessionsPersonalStatistic: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC
  },

  getConversation(period: PERIODS) {
    return async (
      _conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const [startDate, endDate] = getTimeRange(period)

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
        await getStatisticForPeriod(
          ctx,
          {
            from: startDate.getTime(),
            to: endDate.getTime(),
          },
          ctx.psychologist?._id
        )

      const sessions = await getTherapySessions(
        ctx,
        ctx.psychologist?._id,
        undefined,
        {
          from: startDate.getTime(),
          to: endDate.getTime(),
        }
      )

      const sessionDetailsByClientId: { [key: string]: Array<string> } = {}
      if (sessions.length) {
        const sessionsByClient = groupBy(
          sessions,
          (session) => session.client._id
        )

        Object.entries(sessionsByClient).forEach(([clientId, sessions]) => {
          sessionDetailsByClientId[clientId] =
            sessionDetailsByClientId[clientId] || []
          sessionDetailsByClientId[clientId].push(
            ...sessions.map((session) => {
              return `${ReplyMarkup.tab} - ${
                session.date
              }, сумма ${getSumsForPrices([session.price]).join(
                ", "
              )}, комиссия ${getSumsForPrices([session.comission]).join(", ")}`
            })
          )
        })
      }

      if (sessionsStatistic.length) {
        const commonSum: Array<PriceDto> = []
        const commonComission: Array<PriceDto> = []
        const content: Array<string> = sessionsStatistic.map((stat, index) => {
          const summ = getSumsForPrices(stat.price)
          const comission = getSumsForPrices(stat.comission)

          commonSum.push(...stat.price)
          commonComission.push(...stat.comission)

          return getTextOfData(
            ReplyMarkup.escapeForParseModeV2(
              `${index + 1}. ${stat.client.name}`
            ),
            {
              countForPeriod: sessionDetailsByClientId[stat.client._id]
                ? ReplyMarkup.newLine +
                  sessionDetailsByClientId[stat.client._id].join(
                    ReplyMarkup.newLine
                  )
                : stat.countForPeriod,
              summ: summ.join(", "),
              comission: comission.join(", "),
              countAll: stat.countAll,
            },
            {
              countForPeriod: "сессии за период",
              countAll: "сессий всего",
              summ: "сумма за период",
              comission: "комиссия за период",
            }
          )
        })

        content.push(
          `Общая сумма за период: *${getSumsForPrices(commonSum).join(",")}*${
            ReplyMarkup.newLine
          }Общая комиссия за период: *${getSumsForPrices(commonComission).join(
            ","
          )}*`
        )

        await ctx.reply(
          content.join(ReplyMarkup.doubleNewLine),
          ReplyMarkup.parseModeV2
        )
      } else {
        await ctx.reply("*Записей нет*", ReplyMarkup.parseModeV2)
      }

      return undefined
    }
  },
}

export default therapySessionsPersonalStatistic
