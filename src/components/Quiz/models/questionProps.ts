import { QUESTION_TYPES } from "../enums/quiestionTypes"
import { AnswerProps } from "../types/answerProps"

export type QuestionProps = {
  content: string
  mandatory?: boolean
  type?: QUESTION_TYPES
  answers: Array<AnswerProps> // mongoose.Types.DocumentArray<AnswerProps>
}
