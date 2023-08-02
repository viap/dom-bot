import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { MenuBlock } from "../components/MenuBlock/menuBlock"
import { SessionData } from "../types/sessionData"

import ConversationsList from "../conversations"
import { CONVERSATION_SELECT_MENU_ITEM_TEXTS } from "./enums/conversationSelectMenuItemTexts.enum"

export class SelectMenuItem<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  constructor(private menu?: MenuBlock) {
    if (menu) {
      this.menu = menu
    }
  }

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      if (!this.menu) {
        await ctx.reply(CONVERSATION_SELECT_MENU_ITEM_TEXTS.EMPTY_MENY)
        return
      }

      this.menu.selectRoot()
      while (
        !this.menu.getCurrentConversation() &&
        this.menu.getCurrentAvailableItems().length
      ) {
        await ctx.reply(this.menu.getCurrentName() + ":", {
          reply_markup: this.menu.getKeyboard().oneTime(true),
        })

        const {
          msg: { text },
        } = await conversation.waitFor("message:text")

        if (text === CONVERSATION_SELECT_MENU_ITEM_TEXTS.NEXT) {
          this.menu.nextPage()
        } else if (text === CONVERSATION_SELECT_MENU_ITEM_TEXTS.PREV) {
          this.menu.prevPage()
        } else {
          this.menu.selectItem(text)
        }
      }

      const conversationName = this.menu.getCurrentConversation()
      if (conversationName && conversationName in ConversationsList) {
        await new ConversationsList[conversationName]().getConversation()(
          conversation,
          ctx
        )
      }
    }
  }
}
