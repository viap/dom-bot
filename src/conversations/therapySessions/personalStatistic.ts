import { Conversation } from "@grammyjs/conversations"
import { getStatisticForPeriod } from "../../api/controllerTherapySessions/getStatisticForPeriod"
import { TherapySessionsStatisticDto } from "../../common/dto/therapySessionsStatistic.dto"
import { PERIODS } from "../../common/enums/periods"
import { MyContext } from "../../common/types/myContext"
import { getSumsForPrices } from "../../common/utils/getSumsForPrices"
import { getTextOfData } from "../../common/utils/getTextOfData"
import { getTimeRange } from "../../common/utils/getTimeRange"
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

      if (sessionsStatistic.length) {
        const content: Array<string> = sessionsStatistic.map((stat, index) => {
          return getTextOfData(
            ReplyMarkup.escapeForParseModeV2(
              `${index + 1}. ${stat.client.name}:`
            ),
            {
              countForPeriod: stat.countForPeriod,
              countAll: stat.countAll,
              summ: getSumsForPrices(stat.price).join(", "),
              comission: getSumsForPrices(stat.comission).join(", "),
            },
            {
              countForPeriod: "сессий за период",
              countAll: "сессий всего",
              progress: "всего",
              summ: "сумма",
              comission: "комиссия",
            }
          )
        })

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
