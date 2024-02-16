import { Conversation, ConversationFn } from "@grammyjs/conversations"
import { Keyboard } from "grammy"
import { oneDayInMilliseconds } from "../../common/consts/oneDayInMilliseconds"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { ACTION_BUTTON_TEXTS } from "../../common/enums/actionButtonTexts"
import { MyContext } from "../../common/types/myContext"
import { getTextOfData } from "../../common/utils/getTextOfData"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { MENU_ITEM_TYPES } from "../../components/MenuBlock/enums/menuItemTypes"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversations } from "../index"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

enum ACTIONS {
  DELETE = "Удалить",
  EDIT = "Редактировать",
}

function getAnotherConversation(
  conversation: CONVERSATION_NAMES,
  props: Array<unknown>
): ConversationFn<MyContext> | undefined {
  const deleteTherapySession = BotConversations.getByName(conversation)

  if (deleteTherapySession) {
    return deleteTherapySession.getConversation(...props)
  }
}

const therapySessionShow: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_SHOW
  },

  getConversation(_client: ClientDto, session: TherapySessionDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined | unknown> => {
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

      const keyboard = new Keyboard()

      if (deletionIsAvailable) {
        keyboard
          .row(
            { text: ACTION_BUTTON_TEXTS.BACK },
            { text: ACTION_BUTTON_TEXTS.MAIN_MENU }
          )
          // .row(ACTIONS.EDIT)
          .row(ACTIONS.DELETE)
      }

      await ctx.reply(content, {
        ...ReplyMarkup.parseModeV2,
        reply_markup: keyboard,
      })

      if (deletionIsAvailable) {
        ctx = await conversation.waitFor("message:text")
        const text = ctx.msg?.text || ""

        let conv: ReturnType<typeof getAnotherConversation>
        switch (text) {
          case ACTION_BUTTON_TEXTS.MAIN_MENU:
            return {
              goTo: MENU_ITEM_TYPES.MAIN,
            }
          case ACTION_BUTTON_TEXTS.BACK:
            return
          // case ACTIONS.EDIT:
          //   conv = getAnotherConversation(
          //     CONVERSATION_NAMES.THERAPY_SESSION_EDIT,
          //     [_client, session]
          //   )
          //   if (conv) {
          //     return await conv(conversation, ctx)
          //   }
          //   return
          case ACTIONS.DELETE:
            conv = getAnotherConversation(
              CONVERSATION_NAMES.THERAPY_SESSION_DELETE,
              [session]
            )
            if (conv) {
              return await conv(conversation, ctx)
            }
            return
        }
      }
    }
  },
}

export default therapySessionShow
