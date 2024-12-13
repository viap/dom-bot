import mongoose from "mongoose"
import { QuizProps } from "../types/quizProps"
import { QuestionProps } from "../types/questionProps"

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
