import { MyContext } from "@/common/types/myContext"
import { SessionData } from "@/common/types/sessionData"
import { sessionInit } from "@/createDomBot"

export type FakeReply = {
  text: string
  options?: unknown
}

type FakeQueuedAnswer =
  | string
  | {
      callbackData: string
    }

type SupportedWaitForFilter =
  | "message:text"
  | ":text"
  | "callback_query:data"

export function makeContext({
  text,
  callbackData,
  session,
}: {
  text?: string
  callbackData?: string
  session?: Partial<SessionData>
} = {}): MyContext {
  const replies: Array<FakeReply> = []
  const from = {
    id: 101,
    is_bot: false,
    first_name: "Test",
    last_name: "User",
    username: "test_user",
  }
  const chat = {
    id: 201,
    type: "private",
  }

  return {
    from,
    chat,
    msg: text ? { text } : undefined,
    message: text ? { text } : undefined,
    callbackQuery: callbackData
      ? {
          id: "callback-query-id",
          from,
          chat_instance: "chat-instance",
          data: callbackData,
          message: {
            message_id: 1,
            date: 1780000000,
            chat,
          },
        }
      : undefined,
    session: {
      ...sessionInit(),
      ...session,
    },
    reply: async (replyText: string, options?: unknown) => {
      replies.push({ text: replyText, options })
      return {
        message_id: replies.length,
        date: 1780000000,
        chat: { id: 201, type: "private" },
        text: replyText,
      }
    },
    api: {
      deleteMessage: async () => true,
    },
    replies,
  } as unknown as MyContext & { replies: Array<FakeReply> }
}

export function makeFakeConversation({
  answers = [],
  now = new Date("2026-07-10T12:00:00.000Z"),
}: {
  answers?: Array<FakeQueuedAnswer>
  now?: Date
} = {}) {
  const queue = [...answers]
  const logs: Array<unknown> = []
  const replies: Array<FakeReply> = []
  const session = sessionInit()
  const makeQueuedContext = () => {
    const answer = queue.shift() || ""
    const ctx = makeContext({
      text: typeof answer === "string" ? answer : undefined,
      callbackData: typeof answer === "string" ? undefined : answer.callbackData,
      session,
    }) as MyContext & {
      replies: Array<FakeReply>
    }
    ;(ctx as unknown as {
      reply: (replyText: string, options?: unknown) => Promise<unknown>
    }).reply = async (replyText: string, options?: unknown) => {
      replies.push({ text: replyText, options })
      return {
        message_id: replies.length,
        date: 1780000000,
        chat: {
          id: 201,
          type: "private",
          first_name: "Test",
          last_name: "User",
          username: "test_user",
        },
        text: replyText,
      }
    }
    return ctx
  }
  const assertMatchesFilter = (
    ctx: MyContext,
    filter: SupportedWaitForFilter
  ) => {
    const hasText =
      typeof ctx.message?.text === "string" || typeof ctx.msg?.text === "string"
    const hasCallbackData = typeof ctx.callbackQuery?.data === "string"
    const matches =
      filter === "message:text" || filter === ":text"
        ? hasText
        : hasCallbackData

    if (!matches) {
      throw new Error(
        `Queued fake conversation update does not match waitFor("${filter}")`
      )
    }
  }

  return {
    session,
    logs,
    replies,
    now: async () => now.getTime(),
    external: async <T>(fn: () => T | Promise<T>) => fn(),
    wait: async () => makeQueuedContext(),
    waitFor: async (filter: SupportedWaitForFilter) => {
      const ctx = makeQueuedContext()
      assertMatchesFilter(ctx, filter)
      return ctx
    },
    log: (...args: Array<unknown>) => {
      logs.push(args)
    },
  }
}
