import mongoose from "mongoose"
import { MENU_ITEM_TYPES } from "../../components/MenuBlock/enums/menuItemTypes"
import { QuizGivenAnswers } from "../../components/Quiz/types/quizGivenAnswers"

export type DeepLink = {
  goTo: MENU_ITEM_TYPES
}

export type SessionData = {
  token?: string
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
}

export const defaultSessionData = {
  hasTermsAgreement: true,
  quizAnswers: {},
}
