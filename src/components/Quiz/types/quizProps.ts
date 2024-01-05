import mongoose from "mongoose"
import { QUIZ_LANG } from "../enums/quizLang"
import { QUIZ_TYPES } from "../enums/quizTypes"
import { QUIZ_STATUS } from "../enums/quizStatus"
import { QuestionProps } from "../types/questionProps"
import { GivenAnswerProps } from "../types/givenAnswerProps"

export type QuizProps = {
  _id: mongoose.Types.ObjectId
  name: string
  descr?: string
  lang?: QUIZ_LANG
  type?: QUIZ_TYPES
  status?: QUIZ_STATUS
  questions: Array<QuestionProps> //Array<QuestionProps>
  givenAnswers?: Array<GivenAnswerProps> // mongoose.Types.DocumentArray<GivenAnswerProps>
  scales: { [key: string]: string }
}
