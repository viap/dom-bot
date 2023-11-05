import mongoose from "mongoose"
import { QuizGivenAnswers } from "../../components/Quiz/types/quizGivenAnswers"
import MENU_ITEM_TYPES from "../../components/MenuBlock/enums/menuItemTypes.enum"

export type DeepLink = {
  goTo: MENU_ITEM_TYPES
}

export type SessionData = {
  token?: string
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  deepLink?: DeepLink

  quizAnswers: QuizGivenAnswers
}

export const defaultSessionData = {
  hasTermsAgreement: false,
  quizAnswers: {},
}
