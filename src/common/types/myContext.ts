import { SessionData } from "@/common/types/sessionData"
import { ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor
