import { Conversation } from "@grammyjs/conversations"
import { MenuBlock } from "../components/MenuBlock/menuBlock"

import { getMeUser } from "../api/getMeUser"
import { DefaultMenu } from "../components/MenuBlock/consts/defaultMenu"
import { MyContext } from "../types/myContext"
import { CONVERSATION_ERRORS } from "./enums/conversationErrors.enum"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { BotConversation } from "./types/botConversation"

export const SelectMenuItem: BotConversation = {
  async contextPreload(ctx) {
    const user = await getMeUser(ctx)

    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    const menuBlock = DefaultMenu ? new MenuBlock(user, DefaultMenu) : undefined

    return [menuBlock]
  },

  getName() {
    return CONVERSATION_NAMES.SELECT_MENU_ITEM
  },

  getConversation(menu: MenuBlock) {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      if (!menu) {
        await ctx.reply(CONVERSATION_ERRORS.EMPTY_MENU)
        return
      }

      conversation.log("@@@@@@@@@@@@@ SELECT_MENU_ITEM @@@@@@@@@@@@@@@@@@")
      await menu.show(conversation, ctx)
    }
  },
}
