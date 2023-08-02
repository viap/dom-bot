import mongoose from "mongoose"
import { QuizLang } from "../enums/quizLang.enum"
import { QuizTypes } from "../enums/quizTypes.enum"
import { QuizStatus } from "../enums/quizStatus.enum"
import { QuestionProps } from "../types/questionProps"
import { GivenAnswerProps } from "../types/givenAnswerProps"

export type QuizProps = {
  _id: mongoose.Types.ObjectId
  name: string
  descr?: string
  lang?: QuizLang
  type?: QuizTypes
  status?: QuizStatus
  questions: Array<QuestionProps> //Array<QuestionProps>
  givenAnswers?: Array<GivenAnswerProps> // mongoose.Types.DocumentArray<GivenAnswerProps>
  scales: { [key: string]: string }
}
