import { AnswerProps } from "../types/answerProps"
import { QuestionTypes } from "../enums/quiestionTypes.enum"

export type QuestionProps = {
  content: string
  mandatory?: boolean
  type?: QuestionTypes
  answers: Array<AnswerProps> // mongoose.Types.DocumentArray<AnswerProps>
}
