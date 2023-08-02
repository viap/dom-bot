import mongoose from "mongoose"
import { QuizGivenAnswers } from "../components/Quiz/types/quizGivenAnswers"

export type SessionData = {
  token?: string
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
}
