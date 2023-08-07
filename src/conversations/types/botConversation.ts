import { ConversationFn } from "@grammyjs/conversations"
import { MyContext } from "../../types/myContext"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"

export type BotConversation = {
  contextPreload?(ctx: MyContext): Promise<Array<any> | never>
  getName(): CONVERSATION_NAMES
  getConversation(...props: any): ConversationFn<MyContext>
}
