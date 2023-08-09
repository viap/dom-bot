import { Conversation } from "@grammyjs/conversations"
import { MyContext } from "../types/myContext"
import { BotConversation } from "./types/botConversation"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"

export const ClientDetails: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.CLIENT_DETAILS
  },

  getConversation(props) {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      await ctx.reply("Тут информация о выбранном клиенте")
      await ctx.reply(JSON.stringify(props))
    }
  },
}
