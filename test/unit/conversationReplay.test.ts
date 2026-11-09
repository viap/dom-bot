import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { createDomBot } from "@/createDomBot"
import { ACTION_BUTTON_TEXTS } from "@/common/enums/actionButtonTexts"
import therapySessionShow from "@/conversations/therapySessions/show"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { CURRENCIES } from "@/common/enums/currencies"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
import { SessionData } from "@/common/types/sessionData"
import { AxiosError, InternalAxiosRequestConfig } from "axios"
import { Bot, MiddlewareFn } from "grammy"
import { withMockedApiClient } from "../helpers/apiClientMock"
import { CloningSessionStorage } from "../helpers/cloningSessionStorage"
import { makeContext, makeFakeConversation } from "../helpers/fakeConversation"
import {
  makeClient,
  makePsychologist,
  makeTherapySession,
  makeUser,
} from "../helpers/fixtures"
import { installTelegramApiRecorder, messageUpdate } from "../helpers/telegram"

const SESSION_KEY = "101/201"

function makeAuth(roles: Array<ROLES>): MiddlewareFn<MyContext> {
  return async (ctx, next) => {
    const user = makeUser({ roles })
    Object.assign(ctx.session, {
      token: "test-token",
      user,
      psychologist: makePsychologist({ user }),
    })
    await next()
  }
}

function makeBot(
  authMiddleware: MiddlewareFn<MyContext>,
  updateTimeoutMs?: number
) {
  const storage = new CloningSessionStorage<SessionData>()
  const bot = createDomBot({
    token: "123:test-token",
    botConfig: {
      botInfo: {
        id: 123,
        is_bot: true,
        first_name: "DOM Test Bot",
        username: "PsyDom_Tbilisi_Test_bot",
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
      },
    },
    sessionStorage: storage,
    authMiddleware,
    applicationReplyMiddleware: async (_ctx, next) => next(),
    updateTimeoutMs,
  })
  const telegram = installTelegramApiRecorder(bot)
  let updateId = 0
  const send = async (...texts: Array<string>) => {
    for (const text of texts) {
      updateId += 1
      await withinMs(bot.handleUpdate(messageUpdate(text, { updateId })), 2000)
    }
  }

  return { bot: bot as Bot<MyContext>, storage, telegram, send }
}

function withinMs<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`update hung for ${ms}ms`)), ms)
    ),
  ])
}

function apiError(config: InternalAxiosRequestConfig): never {
  throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config)
}

function storedConversation(storage: CloningSessionStorage<SessionData>) {
  const stored = storage.read(SESSION_KEY) as { conversation?: unknown }
  return JSON.stringify(stored?.conversation)
}

describe("persisted conversation replay", () => {
  let originalApiUrl: string | undefined

  beforeEach(() => {
    originalApiUrl = process.env.API_URL
    process.env.API_URL = "http://dom-api.test"
  })

  afterEach(() => {
    process.env.API_URL = originalApiUrl
  })

  // Regression: the menu stays active after a therapy request is sent, so the
  // next update replays the whole form. Replay used to refetch psychologists
  // with the stale logged token; a 401 diverged the replay and the plugin
  // waited forever, blocking every later update of that user.
  it("does not refetch form data when replaying a sent therapy request", async () => {
    let apiDown = false
    const mock = withMockedApiClient((config) => {
      if (apiDown) apiError(config)
      if (config.method === "get" && config.url?.endsWith("/psychologists")) {
        return {
          status: 200,
          data: [makePsychologist({ _id: "psychologist-2" })],
        }
      }
      return { status: 200, data: { _id: "therapy-request-created" } }
    })
    const { telegram, send } = makeBot(
      makeAuth([ROLES.USER, ROLES.PSYCHOLOGIST, ROLES.EDITOR])
    )

    try {
      await send(
        `/${BOT_COMMANDS.MENU}`,
        "Оставить заявку",
        "Client Name",
        "Client request text",
        "Женщина",
        "Индивидуальная терапия",
        "Psy One",
        "@client_login"
      )
      assert.equal(
        telegram
          .byMethod("sendMessage")
          .some((call) => call.payload.text === "*Ваш запрос отправлен*"),
        true
      )

      apiDown = true
      const callsBeforeReplay = mock.calls.length
      const sentBeforeReplay = telegram.byMethod("sendMessage").length

      await send("Заявки")

      assert.equal(mock.calls.length, callsBeforeReplay)
      assert.ok(telegram.byMethod("sendMessage").length > sentBeforeReplay)
    } finally {
      mock.restore()
    }
  })

  it("stores only safe details of a failed load and replays it", async () => {
    const mock = withMockedApiClient((config) => apiError(config))
    const { storage, send } = makeBot(
      makeAuth([ROLES.USER, ROLES.PSYCHOLOGIST, ROLES.EDITOR])
    )

    try {
      await send(`/${BOT_COMMANDS.MENU}`, "Оставить заявку")
      const callsBeforeReplay = mock.calls.length
      assert.ok(callsBeforeReplay > 0)

      const stored = storedConversation(storage)
      assert.match(stored, /Request failed/)
      assert.doesNotMatch(stored, /Authorization|Bearer/)

      await send("О нас")

      assert.equal(mock.calls.length, callsBeforeReplay)
    } finally {
      mock.restore()
    }
  })

  it("keeps only the report text of a statistics view in the log", async () => {
    let apiDown = false
    const mock = withMockedApiClient((config) => {
      if (apiDown) apiError(config)
      if (config.url?.includes("/statistic/")) {
        return {
          status: 200,
          data: [
            {
              client: makeUser({ _id: "client-user-1", name: "Client One" }),
              psychologist: makePsychologist(),
              from: "",
              to: "",
              price: [{ currency: CURRENCIES.GEL, value: 100 }],
              commission: [{ currency: CURRENCIES.GEL, value: 50 }],
              countForPeriod: 1,
              countAll: 1,
            },
          ],
        }
      }
      if (config.url?.includes("/therapy-sessions")) {
        return {
          status: 200,
          data: [makeTherapySession({ descr: "PRIVATE-SESSION-NOTE" })],
        }
      }
      return { status: 200, data: [] }
    })
    const { storage, telegram, send } = makeBot(
      makeAuth([ROLES.USER, ROLES.PSYCHOLOGIST])
    )

    try {
      await send(
        `/${BOT_COMMANDS.MENU}`,
        "Мои клиенты",
        "Статистика",
        "Текущая неделя"
      )
      assert.equal(
        telegram
          .byMethod("sendMessage")
          .some((call) => String(call.payload.text).includes("Client One")),
        true
      )
      assert.doesNotMatch(storedConversation(storage), /PRIVATE-SESSION-NOTE/)

      apiDown = true
      const callsBeforeReplay = mock.calls.length

      await send("unknown item")

      assert.equal(mock.calls.length, callsBeforeReplay)
    } finally {
      mock.restore()
    }
  })

  it("exits a conversation whose update was released by the watchdog", async () => {
    const auth = makeAuth([ROLES.USER])
    let hangNext = false
    const { telegram, send } = makeBot(async (ctx, next) => {
      if (hangNext) {
        hangNext = false
        await new Promise(() => {})
      }
      await auth(ctx, next)
    }, 30)
    // The watchdog timer is unref()'d; long polling keeps production alive.
    const keepAlive = setInterval(() => undefined, 10)
    const originalError = console.error
    console.error = () => undefined

    try {
      await send(`/${BOT_COMMANDS.MENU}`)
      hangNext = true
      await send("stuck update")
      await send("О нас")
    } finally {
      clearInterval(keepAlive)
      console.error = originalError
    }

    const texts = telegram.byMethod("sendMessage").map((c) => c.payload.text)
    assert.ok(texts.includes(BOT_TEXTS.RECOVERY_STUCK))
  })
})

describe("time-dependent conversation branches", () => {
  // Date.now() inside a conversation changes on replay: a session viewed
  // within its 7-day deletion window and replayed after it would skip a wait
  // and diverge. conversation.now() returns the logged first-run time.
  it("decides session deletion availability from conversation.now()", async () => {
    const conversation = makeFakeConversation({
      answers: [ACTION_BUTTON_TEXTS.BACK],
      now: new Date("2026-07-10T13:00:00.000Z"),
    })
    const ctx = makeContext()
    const session = makeTherapySession({
      createdAt: "2026-07-10T12:00:00.000Z",
    })

    await therapySessionShow.getConversation(makeClient(), session)(
      conversation as never,
      ctx
    )

    const replies = (ctx as never as { replies: Array<{ options?: unknown }> })
      .replies
    assert.match(JSON.stringify(replies[0].options), /Удалить/)
  })
})
