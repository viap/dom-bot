import mongoose from "mongoose"
import { AnswerSchema } from "../schemas/answer.schema"

export const AnswerModel = mongoose.model("Answer", AnswerSchema)
