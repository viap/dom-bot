import { Conversation } from "@grammyjs/conversations"
import { PERIODS } from "common/enums/periods"
import { getTherapySessions } from "../../api/controllerTherapySessions/getTherapySessions"
import { MyContext } from "../../common/types/myContext"
import { getSumsForPrices } from "../../common/utils/getSumsForPrices"
import { getTextOfData } from "../../common/utils/getTextOfData"
import { getTimeRange } from "../../common/utils/getTimeRange"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const therapySessionsStatistic: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSIONS_STATISTIC
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

      const sessions = await getTherapySessions(ctx, undefined, undefined, {
        from: startDate.getTime(),
        to: endDate.getTime(),
      })

      const content = getTextOfData(
        "",
        {
          count: sessions.length,
          duration: sessions.reduce((arr, cur) => arr + cur.duration, 0) / 60,
          sum: getSumsForPrices(sessions.map((session) => session.price)).join(
            ", "
          ),
          comission: getSumsForPrices(
            sessions.map((session) => session.comission)
          ).join(", "),
        },
        {
          count: "Количество сессий",
          duration: "Продолжительность (час)",
          sum: "Стоимость",
          comission: "Комиссия",
        }
      )

      await ctx.reply(content, ReplyMarkup.parseModeV2)

      return undefined
    }
  },
}

export default therapySessionsStatistic
