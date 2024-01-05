import { AnswerProps } from "../types/answerProps"
import { QUESTION_TYPES } from "../enums/quiestionTypes"

export type QuestionProps = {
  content: string
  mandatory?: boolean
  type?: QUESTION_TYPES
  answers: Array<AnswerProps> // mongoose.Types.DocumentArray<AnswerProps>
}
