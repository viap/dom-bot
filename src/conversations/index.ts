import { Terms } from "./terms"
import { SelectQiuz } from "./selectQuiz"
import { QuizProgress } from "./quizProgress"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { SelectMenuItem } from "./selectMenuItem"
import { MarkSession } from "./psychologists/markSession"
import { AddClient } from "./psychologists/addClient"

export default {
  [CONVERSATION_NAMES.SELECT_MENU_ITEM]: SelectMenuItem,
  [CONVERSATION_NAMES.TERMS_AGREEMENT]: Terms,
  [CONVERSATION_NAMES.SELECT_QUIZ]: SelectQiuz,
  [CONVERSATION_NAMES.QUIZ_PROGRESS]: QuizProgress,
  [CONVERSATION_NAMES.MARK_SESSION]: MarkSession,
  [CONVERSATION_NAMES.ADD_CLIENT]: AddClient,
}
