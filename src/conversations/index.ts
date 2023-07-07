import { Terms } from "./terms"
import { SelectQiuz } from "./selectQuiz"
import { QuizProgress } from "./quizProgress"
import { CONVERSATION_NAME } from "./consts"
import { SelectMenuItem } from "./selectMenuItem"
import { MarkSession } from "./markSession"

export default {
  [CONVERSATION_NAME.SELECT_MENU_ITEM]: SelectMenuItem,
  [CONVERSATION_NAME.TERMS_AGREEMENT]: Terms,
  [CONVERSATION_NAME.SELECT_QUIZ]: SelectQiuz,
  [CONVERSATION_NAME.QUIZ_PROGRESS]: QuizProgress,
  [CONVERSATION_NAME.MARK_SESSION]: MarkSession,
}
