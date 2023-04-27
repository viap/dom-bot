import mongoose from "mongoose"
import { GivenAnswerProps } from "./GivenAnswer"

export enum QuizType {
  NORMAL,
  CONSISTENT,
}

export enum QuizStatus {
  DISABLED = 0,
  ACTIVE = 1,
}

export enum QuizLang {
  RUS,
  EN,
  GE,
}

export enum QuestionType {
  SINGLE,
  MULTIPLE,
}

export type QuestionProps = {
  content: string
  mandatory?: boolean
  type?: QuestionType
  answers: Array<AnswerProps> // mongoose.Types.DocumentArray<AnswerProps>
}

export type AnswerProps = {
  content: string
  value?: string | number | boolean
  scales: { [key: string]: number }
}

export type QuizProps = {
  _id: mongoose.Types.ObjectId
  name: string
  descr?: string
  lang?: QuizLang
  type?: QuizType
  status?: QuizStatus
  questions: Array<QuestionProps> //Array<QuestionProps>
  givenAnswers?: Array<GivenAnswerProps> // mongoose.Types.DocumentArray<GivenAnswerProps>
  scales: { [key: string]: number }
}

export const QuizSchema = new mongoose.Schema<QuizProps>({
  // _id: { type: mongoose.Types.ObjectId, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  scales: { type: Object, required: true },
  questions: Array<{ type: QuestionProps; required: true }>,

  lang: String,
  descr: String,
  // givenAnswers: Array<{ type: mongoose.Types.ObjectId; required: false }>,
})

export const QuizM = mongoose.model("Quiz", QuizSchema)
