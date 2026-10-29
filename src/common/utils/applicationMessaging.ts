import { InlineKeyboard } from "grammy"

const CALLBACK_PREFIX = "appmsg"

export const APPLICATION_THREADS_BUTTON_TEXT = "Мои переписки"
export const APPLICATION_REPLY_CANCEL_TEXT = "Отмена"

export type ApplicationMessageAction =
  | { type: "reply"; applicationId: string }
  | { type: "threads"; page: number }
  | { type: "main" }
  | { type: "cancel" }

export function applicationReplyCallback(applicationId: string): string {
  return `${CALLBACK_PREFIX}:reply:${applicationId}`
}

export function applicationThreadsCallback(page = 0): string {
  return `${CALLBACK_PREFIX}:threads:${page}`
}

export function applicationMainCallback(): string {
  return `${CALLBACK_PREFIX}:main`
}

export function applicationCancelCallback(): string {
  return `${CALLBACK_PREFIX}:cancel`
}

export function parseApplicationMessageAction(
  data?: string
): ApplicationMessageAction | null {
  if (!data?.startsWith(`${CALLBACK_PREFIX}:`)) return null

  const [, action, value] = data.split(":")
  if (action === "reply" && /^[a-f\d]{24}$/i.test(value || "")) {
    return { type: "reply", applicationId: value }
  }
  if (action === "threads" && /^\d+$/.test(value || "")) {
    return { type: "threads", page: Number.parseInt(value, 10) }
  }
  if (action === "main" && value === undefined) return { type: "main" }
  if (action === "cancel" && value === undefined) return { type: "cancel" }
  return null
}

export function getOfficialApplicationMessageKeyboard(
  applicationId: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text("Ответить", applicationReplyCallback(applicationId))
    .row()
    .text(APPLICATION_THREADS_BUTTON_TEXT, applicationThreadsCallback())
}

export function getApplicationReplySuccessKeyboard(
  applicationId: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text("Ответить ещё", applicationReplyCallback(applicationId))
    .row()
    .text(APPLICATION_THREADS_BUTTON_TEXT, applicationThreadsCallback())
    .row()
    .text("Основное меню", applicationMainCallback())
}

export function getApplicationReplyPromptKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(
    APPLICATION_REPLY_CANCEL_TEXT,
    applicationCancelCallback()
  )
}
