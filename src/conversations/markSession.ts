import { Conversation } from "@grammyjs/conversations"
import { MyContext } from "types/myContext"
import { BotConversation } from "./types/botConversation"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"

export const MarkSession: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.MARK_SESSION
  },

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      return await ctx.reply("Тут отмечаем сессию")
    }
  },
}
