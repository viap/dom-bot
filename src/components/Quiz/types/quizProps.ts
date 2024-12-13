import mongoose from "mongoose"
import { QUIZ_LANG } from "../enums/quizLang"
import { QUIZ_TYPES } from "../enums/quizTypes"
import { QUIZ_STATUS } from "../enums/quizStatus"
import { QuestionProps } from "./questionProps"
import { GivenAnswerProps } from "./givenAnswerProps"

export type QuizProps = {
  _id: mongoose.Types.ObjectId
  name: string
  descr?: string
  lang?: QUIZ_LANG
  type?: QUIZ_TYPES
  status?: QUIZ_STATUS
  questions: Array<QuestionProps>
  givenAnswers?: Array<GivenAnswerProps>
  scales: { [key: string]: string }
}
