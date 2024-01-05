import { Conversation } from "@grammyjs/conversations"
import { deleteTherapySession } from "../../api/controllerTherapySessions/deleteTherapySession"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"
import { getTextOfData } from "../../common/utils/getTextOfData"
import { InlineKeyboard } from "grammy"
import { oneDayInMilliseconds } from "../../common/consts/oneDayInMilliseconds"
import { BotConversations } from "../index"

const therapySessionShow: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_SHOW
  },

  getConversation(client: ClientDto, session: TherapySessionDto) {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      const content = getTextOfData(
        "",
        {
          descr: session.descr,
          date: session.date,
          duration: session.duration,
          price: [session.price.value, session.price.currency].join(" "),
          comission: session.comission
            ? [session.comission.value, session.price.currency].join(" ")
            : "",
        },
        {
          descr: "описание",
          date: "дата",
          duration: "продолжительность",
          price: "цена",
          comission: "комиссия",
        }
      )

      const deletionIsAvailable =
        Date.now() - session.timestamp < oneDayInMilliseconds

      const keyboard = deletionIsAvailable
        ? new InlineKeyboard().text(
            "Удалить сессию",
            JSON.stringify({
              action: CONVERSATION_NAMES.THERAPY_SESSION_DELETE,
              props: [session._id, session.timestamp],
            })
          )
        : undefined

      await ctx.reply(content, {
        ...ReplyMarkup.parseModeV2,
        reply_markup: keyboard,
      })

      // const response = await conversation.waitForCallbackQuery(
      //   CONVERSATION_NAMES.THERAPY_SESSION_DELETE,
      //   {
      //     otherwise: async (ctx) =>
      //       await ctx.reply("Используйте кнопки!", { reply_markup: keyboard }),
      //   }
      // )

      // if (response.match === CONVERSATION_NAMES.THERAPY_SESSION_DELETE) {
      //   const deleteTherapySession = BotConversations.getByName(
      //     CONVERSATION_NAMES.THERAPY_SESSION_DELETE
      //   )

      //   if (deleteTherapySession) {
      //     return await deleteTherapySession.getConversation(client, session)(
      //       conversation,
      //       ctx
      //     )
      //   }
      // }
    }
  },
}

export default therapySessionShow
