import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { UserDto } from "@/common/dto/user.dto"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { QuizGivenAnswers } from "@/components/Quiz/types/quizGivenAnswers"
import mongoose from "mongoose"

export type DeepLink = {
  goTo: MENU_ITEM_TYPES
}

export type SessionData = {
  token?: string
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
  user?: UserDto
  psychologist?: PsychologistDto
}

export const defaultSessionData = {
  hasTermsAgreement: true,
  quizAnswers: {},
}
