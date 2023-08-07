import { Conversation } from "@grammyjs/conversations"
import { MenuBlock } from "../components/MenuBlock/menuBlock"

import { MyContext } from "../types/myContext"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { ACTION_BUTTONS } from "./enums/actionButtons.enum"
import { BotConversations } from "./index"
import { BotConversation } from "./types/botConversation"
import { getMeUser } from "../api/getMeUser"
import { DefaultMenu } from "../components/MenuBlock/consts/defaultMenu"
import { ReplyMarkup } from "../common/utils/replyMarkup"

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
        await ctx.reply(ACTION_BUTTONS.EMPTY_MENU)
        return
      }

      menu.selectRoot()
      while (
        !menu.getCurrentConversation() &&
        menu.getCurrentAvailableItems().length
      ) {
        await ctx.reply(`*${menu.getCurrentName().toUpperCase()}*:`, {
          ...ReplyMarkup.keyboard(menu.getKeyboard()),
          ...ReplyMarkup.oneTime,
          ...ReplyMarkup.parseModeV2,
        })

        ctx = await conversation.waitFor("message:text")
        const text = ctx.msg?.text || ""

        if (text === ACTION_BUTTONS.NEXT) {
          menu.nextPage()
        } else if (text === ACTION_BUTTONS.PREV) {
          menu.prevPage()
        } else if (text === ACTION_BUTTONS.HOME) {
          menu.selectRoot()
        } else if (text === ACTION_BUTTONS.BACK) {
          menu.selectRoot()
        } else {
          menu.selectItem(text)
        }
      }

      const conversationName = menu.getCurrentConversation()
      const botConversation = conversationName
        ? BotConversations.getByName(conversationName)
        : undefined

      console.log("conversationName", conversationName)
      console.log("getList", BotConversations.getList())
      console.log("botConversation", botConversation)

      if (botConversation) {
        await botConversation.getConversation()(conversation, ctx)
      }
    }
  },
}
