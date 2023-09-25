import { ConversationFn } from "@grammyjs/conversations"
import { MyContext } from "common/types/myContext"
import { CONVERSATION_NAMES } from "conversations/enums/conversationNames.enum"

export type BotConversation = {
  contextPreload?(ctx: MyContext): Promise<Array<unknown> | never>
  getName(): CONVERSATION_NAMES
  getConversation(...props: Array<unknown>): ConversationFn<MyContext>
}
