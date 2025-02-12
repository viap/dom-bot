import { Conversation } from "@grammyjs/conversations"
import { Keyboard } from "grammy"
import { oneDayInMilliseconds } from "@/common/consts/oneDayInMilliseconds"
import { ClientDto } from "@/common/dto/client.dto"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { ACTION_BUTTON_TEXTS } from "@/common/enums/actionButtonTexts"
import { getTextOfTherapySession } from "@/common/texts/getTextOfTherapySession"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { BotConversation } from "../types/botConversation"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { ConversationResult } from "../types/conversationResult"
import { BotConversations } from "../index"

enum ACTIONS {
  DELETE = "Удалить",
  EDIT = "Редактировать",
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
      const content = getTextOfTherapySession(session)

      const deletionIsAvailable =
        Date.now() - session.timestamp < oneDayInMilliseconds * 7

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

        let conv: BotConversation | undefined
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
            conv = BotConversations.getByName(
              CONVERSATION_NAMES.THERAPY_SESSION_DELETE
            )

            if (conv) {
              return await conv.getConversation(session)(conversation, ctx)
            }
            return
        }
      }
    }
  },
}

export default therapySessionShow
