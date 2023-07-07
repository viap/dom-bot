import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { SessionData } from "../types"

export class MarkSession<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  // constructor() {}

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      return await ctx.reply("Отметить сессию")
    }
  }
}
