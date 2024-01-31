import { Conversation } from "@grammyjs/conversations"
import { PERIODS } from "common/enums/periods"
import { getStatisticForPeriod } from "../../api/controllerTherapySessions/getStatisticForPeriod"
import { numberOfCommissionHours } from "../../common/consts/numberOfCommissionHours"
import { TherapySessionsStatisticDto } from "../../common/dto/therapySessionsStatistic.dto"
import { MyContext } from "../../common/types/myContext"
import { getSumsForPrices } from "../../common/utils/getSumsForPrices"
import { getTimeRange } from "../../common/utils/getTimeRange"
import { groupBy } from "../../common/utils/groupBy"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"
import { PriceDto } from "common/dto/price.dto"

const therapySessionsGeneralStatistic: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC
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
          ([_id, sessions]: [string, Array<TherapySessionsStatisticDto>]) => {
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

      return undefined
    }
  },
}

export default therapySessionsGeneralStatistic
