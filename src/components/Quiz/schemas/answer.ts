import mongoose from "mongoose"
import { AnswerProps } from "../types/answerProps"

export const AnswerSchema = new mongoose.Schema<AnswerProps>({
  content: String,
  value: mongoose.Schema.Types.Mixed,
  scales: Object,
})
