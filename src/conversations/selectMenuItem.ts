import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { SessionData } from "../types"
import { MENU_LISTS, MenuModel } from "../models/Menu"
import { MenuBlock } from "../components/MenuBlock"

export class SelectMenuItem<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  constructor(private menu: MenuBlock) {
    this.menu = menu
  }

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
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

      await ctx.reply(
        "Выбрано действие:" + JSON.stringify(this.menu.getCurrent())
      )

      if (current.conversation) {
        //do something
      }

      return
    }
  }
}
