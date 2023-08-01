import mongoose from "mongoose"
import { QuizGivenAnswers } from "."

export type SessionData = {
  token?: string
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
}
