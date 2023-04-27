import mongoose from "mongoose"

export type AnswerProps = {
  content: string
  value?: string | number | boolean
  scales: { [key: string]: number }
}

export const AnswerSchema = new mongoose.Schema<AnswerProps>({
  content: String,
  value: mongoose.Schema.Types.Mixed,
  scales: Object,
})

export const Answer = mongoose.model("Answer", AnswerSchema)
