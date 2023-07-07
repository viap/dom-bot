import mongoose from "mongoose"
import { GivenAnswerProps } from "../models/GivenAnswer"

export type QuizGivenAnswers = {
  [key: string]: Array<GivenAnswerProps>
}

export type SessionData = {
  hasTermsAgreement: boolean
  selectedQuiz?: mongoose.Types.ObjectId
  quizAnswers: QuizGivenAnswers
}

export type ContactInfo = {
  telegram?: string
  instagram?: string
  whatsapp?: string
  phone?: string
}

export type Psychologist<T> = {
  schools: Array<T>
  name: string
  descr: string
  photo?: string
  contacts: ContactInfo
}
