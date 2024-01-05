import mongoose from "mongoose"
import { AnswerSchema } from "../schemas/answer"

export const AnswerModel = mongoose.model("Answer", AnswerSchema)
