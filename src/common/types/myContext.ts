import { ConversationFlavor } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"
import { SessionData } from "./sessionData"
import { UserDto } from "../../common/dto/user.dto"
import { PsychologistDto } from "common/dto/psychologist.dto"

export type MyContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor & {
    user: UserDto
    psychologist?: PsychologistDto
  }
