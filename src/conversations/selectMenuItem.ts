import { Conversation } from "@grammyjs/conversations"
import { MenuBlock } from "../components/MenuBlock/menuBlock"

import { MyContext } from "../common/types/myContext"
import { DefaultMenu } from "../components/MenuBlock/consts/defaultMenu"
import { CONVERSATION_ERRORS } from "./enums/conversationErrors.enum"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { BotConversation } from "./types/botConversation"

export const SelectMenuItem: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.SELECT_MENU_ITEM
  },

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      const menu = DefaultMenu
        ? new MenuBlock(conversation, ctx, DefaultMenu)
        : undefined
      if (!menu) {
        await ctx.reply(CONVERSATION_ERRORS.EMPTY_MENU)
        return
      }

      conversation.log("@@@@@@@@@@@@@ SELECT_MENU_ITEM @@@@@@@@@@@@@@@@@@")
      await menu.show()
    }
  },
}
