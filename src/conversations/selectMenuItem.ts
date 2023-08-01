import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { MenuBlock } from "../components/MenuBlock"
import { SessionData } from "../types/sessionData"

import ConversationsList from "../conversations"
import { SELECT_MENU_ITEM } from "./consts"

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
        await ctx.reply(SELECT_MENU_ITEM.EMPTY_MENY)
        return
      }

      // Set top menu item as current
      this.menu.selectItem("")

      let current = this.menu.getCurrent()
      while (!current.conversation && current.children?.length) {
        await ctx.reply(current.name + ":", {
          reply_markup: this.menu.getKeyboard().oneTime(),
        })

        const response = await conversation.waitFor("message:text")
        this.menu.selectItem(response.msg.text)
        current = this.menu.getCurrent()
      }

      // await ctx.reply(
      //   "Выбрано действие:" + JSON.stringify(this.menu.getCurrent())
      // )

      if (current.conversation && current.conversation in ConversationsList) {
        await new ConversationsList[current.conversation]().getConversation()(
          conversation,
          ctx
        )
      }
    }
  }
}
