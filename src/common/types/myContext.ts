import { ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { SessionData } from "./sessionData"

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor
