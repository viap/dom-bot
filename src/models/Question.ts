import { AnswerProps } from "./Answer"

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

// export const QuestionSchema = new mongoose.Schema<QuestionProps>({
//   content: String,
//   mandatory: Boolean,
//   type: String,
//   answers: Array<{ type: mongoose.Types.ObjectId; ref: "Answer" }>,
// })

// export const Question = mongoose.model("Question", QuestionSchema)
