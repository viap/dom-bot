import mongoose from "mongoose"
import { QuizSchema } from "../schemas/quiz"

export const QuizModel = mongoose.model("Quiz", QuizSchema)
