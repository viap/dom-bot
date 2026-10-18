import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { createDomBot } from "@/createDomBot"
import { CONVERSATION_VERSION } from "@/common/consts/conversationVersion"
import { ROLES } from "@/common/enums/roles"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { SessionData } from "@/common/types/sessionData"
import { createAccessKey } from "@/common/utils/interactionIdentity"
import { CloningSessionStorage } from "../helpers/cloningSessionStorage"
import { BotConfig } from "grammy"
import { MyContext } from "@/common/types/myContext"
import { makePsychologist, makeUser } from "../helpers/fixtures"
import { withMockedApiClient } from "../helpers/apiClientMock"
import { AxiosError, InternalAxiosRequestConfig } from "axios"
import {
  installTelegramApiRecorder,
  messageUpdate,
} from "../helpers/telegram"

const botConfig: BotConfig<MyContext> = {
  botInfo: {
    id: 123,
    is_bot: true,
    first_name: "DOM Test Bot",
    username: "dom_test_bot",
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
  },
}

function makeJwt(
  userId: string,
  roles: Array<ROLES>,
  signature = "signature"
): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    userId,
    roles,
    clientName: "bot-client",
  })}.${signature}`
}

function makeAxiosError(
  config: InternalAxiosRequestConfig,
  status?: number
): AxiosError {
  return new AxiosError(
    "DOM API request failed",
    status ? "ERR_BAD_RESPONSE" : "ERR_NETWORK",
    config,
    undefined,
    status
      ? {
          status,
          statusText: String(status),
          headers: {},
          config,
          data: { error: "request failed" },
        }
      : undefined
  )
}

describe("current authentication and role alignment", () => {
  let previousApiUrl: string | undefined
  let previousClientName: string | undefined
  let previousClientPassword: string | undefined

  beforeEach(() => {
    previousApiUrl = process.env.API_URL
    previousClientName = process.env.API_CLIENT_NAME
    previousClientPassword = process.env.API_CLIENT_PASSWORD
    process.env.API_URL = "http://dom-api.test"
    process.env.API_CLIENT_NAME = "bot-client"
    process.env.API_CLIENT_PASSWORD = "bot-password"
  })

  afterEach(() => {
    process.env.API_URL = previousApiUrl
    process.env.API_CLIENT_NAME = previousClientName
    process.env.API_CLIENT_PASSWORD = previousClientPassword
  })

  it("logs in to align stale JWT roles before profile and protected calls", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const previousUser = makeUser({ roles: [ROLES.USER] })
    const currentUser = makeUser({
      roles: [ROLES.USER, ROLES.PSYCHOLOGIST],
    })
    const psychologist = makePsychologist({ user: currentUser })
    const oldToken = makeJwt(currentUser._id, [ROLES.USER])
    const freshToken = makeJwt(currentUser._id, currentUser.roles)
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: oldToken,
      user: previousUser,
      interactionState: {
        conversationVersion: CONVERSATION_VERSION,
        accessKey: createAccessKey(previousUser),
      },
    })

    let userReads = 0
    const mock = withMockedApiClient((config) => {
      const url = new URL(config.url || "")
      const authorization = String(config.headers.Authorization)

      if (url.pathname === "/auth/login/telegram") {
        return { status: 200, data: { auth_token: freshToken } }
      }
      if (url.pathname === "/users/me") {
        userReads++
        return { status: 200, data: currentUser }
      }
      if (url.pathname === "/psychologists/me") {
        assert.equal(authorization, `Bearer ${freshToken}`)
        return { status: 200, data: psychologist }
      }
      if (url.pathname === "/psychologists/me/clients") {
        assert.equal(authorization, `Bearer ${freshToken}`)
        return { status: 200, data: [] }
      }
      if (url.pathname === "/therapy-sessions/psychologist/me") {
        assert.equal(authorization, `Bearer ${freshToken}`)
        return { status: 200, data: [] }
      }
      throw new Error(`Unexpected API request: ${url.pathname}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)

      await bot.handleUpdate(messageUpdate("/menu"))
      await bot.handleUpdate(messageUpdate("Мои клиенты", { updateId: 2 }))
      await bot.handleUpdate(messageUpdate("Список клиентов", { updateId: 3 }))

      const loginIndex = mock.calls.findIndex((call) =>
        call.url?.endsWith("/auth/login/telegram")
      )
      const psychologistIndex = mock.calls.findIndex((call) =>
        call.url?.endsWith("/psychologists/me")
      )
      assert.ok(loginIndex >= 0)
      assert.ok(psychologistIndex > loginIndex)
      assert.ok(userReads >= 4)
      assert.equal(
        mock.calls.some((call) => call.url?.endsWith("/auth/check-token")),
        false
      )
      assert.equal(
        mock.calls.some((call) => call.url?.endsWith("/auth/refresh-token")),
        false
      )
      assert.equal(
        mock.calls.some((call) =>
          call.url?.endsWith("/therapy-sessions/psychologist/me")
        ),
        true
      )
      assert.equal(storage.read("101/201")?.token, freshToken)
      assert.deepEqual(storage.read("101/201")?.user?.roles, currentUser.roles)
      assert.equal(storage.read("101/201")?.psychologist?._id, psychologist._id)
      assert.equal(
        telegram
          .byMethod("sendMessage")
          .some(
            (call) =>
              call.payload.text === BOT_TEXTS.PSYCHOLOGIST_PROFILE_MISSING
          ),
        false
      )
      assert.equal(
        telegram.byMethod("sendMessage")[0].payload.text,
        BOT_TEXTS.RECOVERY_ACCESS
      )
    } finally {
      mock.restore()
    }
  })

  it("keeps an unchanged conversation when an expired token is replaced", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const user = makeUser({ roles: [ROLES.USER] })
    const staleToken = makeJwt(user._id, user.roles, "stale")
    const freshToken = makeJwt(user._id, user.roles, "fresh")
    let loginCount = 0
    let rejectNextUserRead = false
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/auth/login/telegram") {
        loginCount++
        return {
          status: 200,
          data: { auth_token: loginCount === 1 ? staleToken : freshToken },
        }
      }
      if (path === "/users/me") {
        if (rejectNextUserRead) {
          rejectNextUserRead = false
          throw makeAxiosError(config, 401)
        }
        return { status: 200, data: user }
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const first = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      installTelegramApiRecorder(first)
      await first.handleUpdate(messageUpdate("/menu"))
      rejectNextUserRead = true

      const second = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(second)
      await second.handleUpdate(messageUpdate("О нас", { updateId: 2 }))

      assert.equal(
        telegram
          .byMethod("sendMessage")
          .some((call) => String(call.payload.text).includes("Психологический центр")),
        true
      )
      assert.equal(
        telegram
          .byMethod("sendMessage")
          .some((call) => call.payload.text === BOT_TEXTS.RECOVERY_ACCESS),
        false
      )
      assert.equal(storage.read("101/201")?.token, freshToken)
      assert.equal(loginCount, 2)
      assert.equal(
        mock.calls.some((call) => call.url?.endsWith("/auth/check-token")),
        false
      )
    } finally {
      mock.restore()
    }
  })

  it("stops after one login when the retried current-user request is rejected", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const user = makeUser({ roles: [ROLES.USER] })
    const oldToken = makeJwt(user._id, user.roles, "old")
    const freshToken = makeJwt(user._id, user.roles, "fresh")
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: oldToken,
      user,
    })
    let loginCount = 0
    let userReadCount = 0
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/users/me") {
        userReadCount++
        throw makeAxiosError(config, 401)
      }
      if (path === "/auth/login/telegram") {
        loginCount++
        return { status: 200, data: { auth_token: freshToken } }
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      const originalError = console.error
      console.error = () => undefined
      try {
        await bot.handleUpdate(messageUpdate("/menu"))
      } finally {
        console.error = originalError
      }

      assert.equal(loginCount, 1)
      assert.equal(userReadCount, 2)
      assert.equal(storage.read("101/201")?.token, oldToken)
      assert.equal(telegram.byMethod("sendMessage")[0].payload.text, BOT_TEXTS.UNAVAILABLE)
    } finally {
      mock.restore()
    }
  })

  it("normalizes and retries an empty psychologist response as missing profile", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const user = makeUser({ roles: [ROLES.USER, ROLES.PSYCHOLOGIST] })
    const token = makeJwt(user._id, user.roles)
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/auth/login/telegram") {
        return { status: 200, data: { auth_token: token } }
      }
      if (path === "/users/me") {
        return { status: 200, data: user }
      }
      if (path === "/psychologists/me") {
        return { status: 200, data: "" }
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      await bot.handleUpdate(messageUpdate("/menu"))
      await bot.handleUpdate(messageUpdate("Мои клиенты", { updateId: 2 }))

      assert.deepEqual(storage.read("101/201")?.user?.roles, user.roles)
      assert.equal(storage.read("101/201")?.psychologist, undefined)
      assert.equal(
        mock.calls.filter((call) => call.url?.endsWith("/psychologists/me"))
          .length,
        2
      )
      assert.equal(
        telegram
          .byMethod("sendMessage")
          .some(
            (call) =>
              call.payload.text === BOT_TEXTS.PSYCHOLOGIST_PROFILE_MISSING
          ),
        true
      )
    } finally {
      mock.restore()
    }
  })

  it("removes psychologist cache and refreshes claims after role removal", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const previousUser = makeUser({
      roles: [ROLES.USER, ROLES.PSYCHOLOGIST],
    })
    const currentUser = makeUser({ roles: [ROLES.USER] })
    const psychologist = makePsychologist({ user: previousUser })
    const oldToken = makeJwt(previousUser._id, previousUser.roles)
    const freshToken = makeJwt(currentUser._id, currentUser.roles)
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: oldToken,
      user: previousUser,
      psychologist,
      interactionState: {
        conversationVersion: CONVERSATION_VERSION,
        accessKey: createAccessKey(previousUser, psychologist),
      },
    })
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/users/me") {
        return { status: 200, data: currentUser }
      }
      if (path === "/auth/login/telegram") {
        return { status: 200, data: { auth_token: freshToken } }
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      await bot.handleUpdate(messageUpdate("/menu"))

      assert.equal(storage.read("101/201")?.psychologist, undefined)
      assert.deepEqual(storage.read("101/201")?.user?.roles, [ROLES.USER])
      assert.equal(
        telegram.byMethod("sendMessage")[0].payload.text,
        BOT_TEXTS.RECOVERY_ACCESS
      )
      assert.equal(
        mock.calls.some((call) => call.url?.endsWith("/psychologists/me")),
        false
      )
    } finally {
      mock.restore()
    }
  })

  it("rolls back an inconsistent login and succeeds on a later retry", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const oldUser = makeUser({ roles: [ROLES.USER] })
    const changedUser = makeUser({ roles: [ROLES.USER, ROLES.EDITOR] })
    const oldToken = makeJwt(oldUser._id, oldUser.roles)
    const inconsistentToken = makeJwt(
      oldUser._id,
      oldUser.roles,
      "inconsistent"
    )
    const alignedToken = makeJwt(changedUser._id, changedUser.roles, "aligned")
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: oldToken,
      user: oldUser,
      interactionState: {
        conversationVersion: CONVERSATION_VERSION,
        accessKey: createAccessKey(oldUser),
      },
    })

    let loginCount = 0
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/users/me") {
        return { status: 200, data: changedUser }
      }
      if (path === "/auth/login/telegram") {
        loginCount++
        return {
          status: 200,
          data: {
            auth_token: loginCount === 1 ? inconsistentToken : alignedToken,
          },
        }
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)

      const originalError = console.error
      console.error = () => undefined
      try {
        await bot.handleUpdate(messageUpdate("/menu"))
      } finally {
        console.error = originalError
      }
      assert.equal(telegram.byMethod("sendMessage")[0].payload.text, BOT_TEXTS.UNAVAILABLE)
      assert.equal(storage.read("101/201")?.token, oldToken)

      await bot.handleUpdate(messageUpdate("/menu", { updateId: 2 }))
      assert.equal(storage.read("101/201")?.token, alignedToken)
      assert.equal(loginCount, 2)
    } finally {
      mock.restore()
    }
  })

  it("uses a cached psychologist profile when its refresh has a transport failure", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const user = makeUser({ roles: [ROLES.USER, ROLES.PSYCHOLOGIST] })
    const psychologist = makePsychologist({ user })
    const token = makeJwt(user._id, user.roles)
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token,
      user,
      psychologist,
      interactionState: {
        conversationVersion: CONVERSATION_VERSION,
        accessKey: createAccessKey(user, psychologist),
      },
    })
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/auth/login/telegram") {
        return { status: 200, data: { auth_token: token } }
      }
      if (path === "/users/me") {
        return { status: 200, data: user }
      }
      if (path === "/psychologists/me") {
        throw makeAxiosError(config)
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      await bot.handleUpdate(messageUpdate("/start"))

      assert.equal(storage.read("101/201")?.psychologist?._id, psychologist._id)
      assert.equal(telegram.byMethod("sendMessage")[0].payload.text, BOT_TEXTS.WELCOME)
    } finally {
      mock.restore()
    }
  })

  it("keeps a fresh token but stops routing when the first psychologist load fails", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const user = makeUser({ roles: [ROLES.USER, ROLES.PSYCHOLOGIST] })
    const token = makeJwt(user._id, user.roles)
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/auth/login/telegram") {
        return { status: 200, data: { auth_token: token } }
      }
      if (path === "/users/me") {
        return { status: 200, data: user }
      }
      if (path === "/psychologists/me") {
        throw makeAxiosError(config)
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      const originalError = console.error
      console.error = () => undefined
      try {
        await bot.handleUpdate(messageUpdate("/menu"))
      } finally {
        console.error = originalError
      }

      assert.equal(telegram.byMethod("sendMessage")[0].payload.text, BOT_TEXTS.UNAVAILABLE)
      assert.equal(storage.read("101/201")?.token, token)
      assert.equal(storage.read("101/201")?.user?._id, user._id)
      assert.equal(storage.read("101/201")?.psychologist, undefined)
    } finally {
      mock.restore()
    }
  })

  it("rejects a token/user identity mismatch and restores the prior token", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const previousUser = makeUser({ roles: [ROLES.USER] })
    const returnedUser = makeUser({
      _id: "different-user",
      roles: [ROLES.USER],
    })
    const previousToken = makeJwt(previousUser._id, previousUser.roles)
    const candidateToken = makeJwt(
      previousUser._id,
      previousUser.roles,
      "candidate"
    )
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: previousToken,
      user: previousUser,
    })
    const mock = withMockedApiClient((config) => {
      const path = new URL(config.url || "").pathname
      if (path === "/users/me") {
        return { status: 200, data: returnedUser }
      }
      if (path === "/auth/login/telegram") {
        return { status: 200, data: { auth_token: candidateToken } }
      }
      throw new Error(`Unexpected API request: ${path}`)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      const originalError = console.error
      console.error = () => undefined
      try {
        await bot.handleUpdate(messageUpdate("/menu"))
      } finally {
        console.error = originalError
      }

      assert.equal(telegram.byMethod("sendMessage")[0].payload.text, BOT_TEXTS.UNAVAILABLE)
      assert.equal(storage.read("101/201")?.token, previousToken)
      assert.equal(storage.read("101/201")?.user?._id, previousUser._id)
    } finally {
      mock.restore()
    }
  })

  it("logs only safe request metadata when authentication fails", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const mock = withMockedApiClient((config) => {
      throw makeAxiosError(config, 500)
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      installTelegramApiRecorder(bot)
      const logged: Array<unknown> = []
      const originalError = console.error
      console.error = (...args: Array<unknown>) => logged.push(args)
      try {
        await bot.handleUpdate(messageUpdate("/menu"))
      } finally {
        console.error = originalError
      }

      const serialized = JSON.stringify(logged)
      assert.match(serialized, /DOM API request failed/)
      assert.doesNotMatch(serialized, /bot-password/)
      assert.doesNotMatch(serialized, /Authorization/i)
      assert.doesNotMatch(serialized, /apiClient/)
    } finally {
      mock.restore()
    }
  })

  it("does not call dom-api for commands addressed to another bot", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const mock = withMockedApiClient(() => {
      throw new Error("dom-api must not be called")
    })

    try {
      const bot = createDomBot({
        token: "123:test-token",
        botConfig,
        sessionStorage: storage,
      })
      const telegram = installTelegramApiRecorder(bot)
      await bot.handleUpdate(messageUpdate("/menu@another_bot"))

      assert.equal(mock.calls.length, 0)
      assert.equal(telegram.calls.length, 0)
    } finally {
      mock.restore()
    }
  })
})
