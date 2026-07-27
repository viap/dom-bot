import { Update } from "@grammyjs/types"
import { Bot, RawApi, Transformer } from "grammy"
import { MyContext } from "@/common/types/myContext"

export type TelegramApiCall = {
  method: string
  payload: Record<string, unknown>
}

export function makeTelegramUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 101,
    is_bot: false,
    first_name: "Test",
    last_name: "User",
    username: "test_user",
    language_code: "ru",
    ...overrides,
  }
}

export function makePrivateChat(overrides: Record<string, unknown> = {}) {
  return {
    id: 201,
    type: "private",
    first_name: "Test",
    last_name: "User",
    username: "test_user",
    ...overrides,
  }
}

export function messageUpdate(
  text: string,
  overrides: {
    updateId?: number
    message?: Record<string, unknown>
    from?: Record<string, unknown>
    chat?: Record<string, unknown>
  } = {}
): Update {
  const from = overrides.from === undefined ? makeTelegramUser() : overrides.from
  const chat = overrides.chat === undefined ? makePrivateChat() : overrides.chat
  const message = {
    message_id: overrides.updateId || 1,
    date: 1780000000,
    text,
    ...(from ? { from } : {}),
    ...(chat ? { chat } : {}),
    ...overrides.message,
  }

  if (text.startsWith("/")) {
    Object.assign(message, {
      entities: [{ type: "bot_command", offset: 0, length: text.length }],
    })
  }

  return {
    update_id: overrides.updateId || 1,
    message,
  } as Update
}

export function callbackUpdate(
  data: string,
  overrides: {
    updateId?: number
    from?: Record<string, unknown>
    chat?: Record<string, unknown>
  } = {}
): Update {
  const from = overrides.from === undefined ? makeTelegramUser() : overrides.from
  const chat = overrides.chat === undefined ? makePrivateChat() : overrides.chat

  return {
    update_id: overrides.updateId || 1,
    callback_query: {
      id: `callback-${overrides.updateId || 1}`,
      from,
      chat_instance: "chat-instance",
      data,
      message: {
        message_id: 1,
        date: 1780000000,
        chat,
      },
    },
  } as Update
}

export function installTelegramApiRecorder(bot: Bot<MyContext>) {
  const calls: Array<TelegramApiCall> = []
  const transformer: Transformer<RawApi> = async (
    _prev,
    method,
    payload
  ) => {
    const recordPayload = payload as Record<string, unknown>
    calls.push({ method, payload: recordPayload })

    return {
      ok: true,
      result: getTelegramResult(method, recordPayload),
    } as never
  }

  bot.api.config.use(transformer)

  return {
    calls,
    byMethod(method: string) {
      return calls.filter((call) => call.method === method)
    },
  }
}

function getTelegramResult(method: string, payload: Record<string, unknown>) {
  switch (method) {
    case "sendMessage":
      return {
        message_id: 1000,
        date: 1780000000,
        chat: { id: payload.chat_id, type: "private" },
        text: payload.text,
      }
    case "setMyCommands":
    case "deleteMyCommands":
    case "answerCallbackQuery":
    case "deleteMessage":
      return true
    default:
      return true
  }
}
