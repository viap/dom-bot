import { Conversation } from "@grammyjs/conversations"
import { MenuBlock } from "../components/MenuBlock/menuBlock"

import { getUser } from "../api/getUser"
import { DefaultMenu } from "../components/MenuBlock/consts/defaultMenu"
import { MyContext } from "../common/types/myContext"
import { CONVERSATION_ERRORS } from "./enums/conversationErrors.enum"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { BotConversation } from "./types/botConversation"
import { UserDto } from "../common/dto/user.dto"

export const SelectMenuItem: BotConversation = {
  async contextPreload(ctx) {
    const user = await getUser(ctx)

    if (!user) {
      throw new Error("Пользователь не авторизован")
    }

    return [user]
  },

  getName() {
    return CONVERSATION_NAMES.SELECT_MENU_ITEM
  },

  getConversation(user: UserDto) {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      const menu = DefaultMenu
        ? new MenuBlock(conversation, ctx, user, DefaultMenu)
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
