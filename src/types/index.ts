import mongoose from "mongoose"
import { GivenAnswerProps } from "../models/GivenAnswer"
import { PSY_SCHOOLS } from "../modules/Quiz/consts"

export type QuizGivenAnswers = {
  [key: string]: Array<GivenAnswerProps>
}

export type SessionData = {
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
}

export type Psychologist<T> = {
  schools: Array<T>
  name: string
  descr: string
  photo?: string
  contacts: {
    telegram?: string
    instagram?: string
    whatsapp?: string
  }
}
