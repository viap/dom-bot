import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { UserDto } from "@/common/dto/user.dto"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { QuizGivenAnswers } from "@/components/Quiz/types/quizGivenAnswers"
import mongoose from "mongoose"

export type DeepLink = {
  goTo: MENU_ITEM_TYPES
}

export type RecoveryReason = "release" | "access"

export type PendingRecovery = {
  reason: RecoveryReason
  interruptedConversation: boolean
}

export type InteractionState = {
  conversationVersion: number
  accessKey?: string
  pendingRecovery?: PendingRecovery
}

export type SessionData = {
  token?: string
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
  user?: UserDto
  psychologist?: PsychologistDto
  interactionState?: InteractionState
  menuDeepLink?: DeepLink
  syncedCommandsKey?: string
}

export const defaultSessionData = {
  hasTermsAgreement: true,
  quizAnswers: {},
}
