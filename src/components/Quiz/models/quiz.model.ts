import mongoose from "mongoose"
import { QuizSchema } from "../schemas/quiz.schema"

export const QuizModel = mongoose.model("Quiz", QuizSchema)
