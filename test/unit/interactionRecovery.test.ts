import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { Bot, BotConfig, MiddlewareFn } from "grammy"
import { createDomBot } from "@/createDomBot"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
import { SessionData } from "@/common/types/sessionData"
import { createAccessKey } from "@/common/utils/interactionIdentity"
import { MANUAL_COMMAND_UNAVAILABLE_TEXT } from "@/common/utils/manualCommand"
import { CONVERSATION_TERMS_TEXTS } from "@/conversations/enums/conversationTermsTexts"
import { CloningSessionStorage } from "../helpers/cloningSessionStorage"
import { makePsychologist, makeUser } from "../helpers/fixtures"
import {
  callbackUpdate,
  installTelegramApiRecorder,
  messageUpdate,
} from "../helpers/telegram"

const botConfig: BotConfig<MyContext> = {
  botInfo: {
    id: 123,
    is_bot: true,
    first_name: "DOM Test Bot",
    username: "PsyDom_Tbilisi_Test_bot",
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
  },
}

function currentIdentityAuth(
  getRoles: () => Array<ROLES>,
  options: { missingPsychologist?: boolean } = {}
): MiddlewareFn<MyContext> {
  return async (ctx, next) => {
    const roles = getRoles()
    const user = makeUser({ roles })
    const psychologist =
      roles.includes(ROLES.PSYCHOLOGIST) && !options.missingPsychologist
        ? makePsychologist({ user })
        : undefined

    Object.assign(ctx.session, { token: "test-token", user, psychologist })
    await next()
  }
}

function makeBot(
  storage: CloningSessionStorage<SessionData>,
  version: number,
  authMiddleware: MiddlewareFn<MyContext>
): Bot<MyContext> {
  return createDomBot({
    token: "123:test-token",
    botConfig,
    sessionStorage: storage,
    authMiddleware,
    conversationVersion: version,
  })
}

describe("interaction recovery with persisted conversations", () => {
  it("discards incompatible replay across recreated bot instances", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)

    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("old form answer", { updateId: 2 }))

    const messages = telegram.byMethod("sendMessage")
    assert.equal(messages[0].payload.text, BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED)
    assert.equal(messages.length, 2)
    assert.notEqual(messages[1].payload.text, BOT_TEXTS.DEFAULT)

    const session = storage.read("101/201")
    assert.equal(session?.interactionState?.conversationVersion, 2)
    assert.equal(session?.interactionState?.pendingRecovery, undefined)
    assert.equal(session?.hasTermsAgreement, true)
  })

  it("resumes unchanged saved menu progress after recreation", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 1, auth)
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
        .some((call) => call.payload.text === BOT_TEXTS.RECOVERY_RELEASE),
      false
    )
  })

  it("recovers on version downgrade and preserves unrelated session data", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 3, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const saved = storage.read("101/201")!
    Object.assign(saved, {
      selectedQuiz: "quiz-id" as never,
      quizAnswers: { preserved: { answer: "yes" } } as never,
    })
    storage.write("101/201", saved)

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("answer", { updateId: 2 }))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED
    )
    assert.equal(storage.read("101/201")?.selectedQuiz, "quiz-id")
    assert.deepEqual(storage.read("101/201")?.quizAnswers, {
      preserved: { answer: "yes" },
    })
  })

  it("opens the current root menu for a version mismatch without active history", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const user = makeUser({ roles: [ROLES.USER] })
    storage.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: "test-token",
      user,
      interactionState: {
        conversationVersion: 1,
        accessKey: createAccessKey(user),
      },
    })
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const bot = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(bot)

    await bot.handleUpdate(messageUpdate("ordinary text"))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_RELEASE
    )
    assert.equal(
      storage.read("101/201")?.interactionState?.pendingRecovery,
      undefined
    )
  })

  it("refreshes an active menu once when access changes", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    let roles = [ROLES.USER]
    const auth = currentIdentityAuth(() => roles)
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    roles = [ROLES.USER, ROLES.PSYCHOLOGIST]
    const second = makeBot(storage, 1, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("stale answer", { updateId: 2 }))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_ACCESS_INTERRUPTED
    )
    const keyboard = JSON.stringify(
      telegram.byMethod("sendMessage")[1].payload.reply_markup
    )
    assert.match(keyboard, /Мои клиенты/)
    assert.match(keyboard, /Мои заявки/)
  })

  it("does not reset when role order and duplicates are the only difference", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    let roles = [ROLES.USER, ROLES.EDITOR]
    const auth = currentIdentityAuth(() => roles)
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    roles = [ROLES.EDITOR, ROLES.USER, ROLES.EDITOR]
    const second = makeBot(storage, 1, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("О нас", { updateId: 2 }))

    assert.equal(
      telegram
        .byMethod("sendMessage")
        .some((call) => call.payload.text === BOT_TEXTS.RECOVERY_ACCESS),
      false
    )
  })

  it("persists pending recovery when Telegram delivery fails and retries", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const failing = makeBot(storage, 2, auth)
    installTelegramApiRecorder(failing, {
      fail: (call) =>
        call.method === "sendMessage" ? new Error("Telegram unavailable") : undefined,
    })
    await failing.handleUpdate(messageUpdate("answer", { updateId: 2 }))
    assert.ok(storage.read("101/201")?.interactionState?.pendingRecovery)

    const retry = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(retry)
    await retry.handleUpdate(messageUpdate("retry", { updateId: 3 }))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED
    )
    assert.equal(
      storage.read("101/201")?.interactionState?.pendingRecovery,
      undefined
    )
  })

  it("keeps callback recovery successful when its single acknowledgement fails", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second, {
      fail: (call) =>
        call.method === "answerCallbackQuery"
          ? new Error("callback expired")
          : undefined,
    })
    await second.handleUpdate(
      callbackUpdate(JSON.stringify({ command: BOT_COMMANDS.MENU }), {
        updateId: 2,
      })
    )

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED
    )
    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
    assert.equal(
      storage.read("101/201")?.interactionState?.pendingRecovery,
      undefined
    )
  })

  it("acknowledges a recovery callback before a failing reply", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second, {
      fail: (call) =>
        call.method === "sendMessage"
          ? new Error("Telegram unavailable")
          : undefined,
    })
    await second.handleUpdate(
      callbackUpdate(JSON.stringify({ command: BOT_COMMANDS.MENU }), {
        updateId: 2,
      })
    )

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
    assert.ok(storage.read("101/201")?.interactionState?.pendingRecovery)
  })

  it("routes the terms recovery callback through the registered conversation", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(
      callbackUpdate(
        JSON.stringify({ command: BOT_COMMANDS.TERMS_AGREEMENT }),
        { updateId: 2 }
      )
    )

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
    assert.deepEqual(
      telegram.byMethod("sendMessage").map((call) => call.payload.text),
      [
        BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED,
        CONVERSATION_TERMS_TEXTS.DESCRIPTION,
      ]
    )
    assert.equal(
      storage.read("101/201")?.interactionState?.pendingRecovery,
      undefined
    )
  })

  it("acknowledges an unsupported recovery callback and opens the root menu", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second)
    const originalLog = console.log
    console.log = () => undefined
    try {
      await second.handleUpdate(
        callbackUpdate(JSON.stringify({ command: "unsupported" }), {
          updateId: 2,
        })
      )
    } finally {
      console.log = originalLog
    }

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED
    )
    assert.equal(telegram.byMethod("sendMessage").length, 2)
    assert.equal(
      storage.read("101/201")?.interactionState?.pendingRecovery,
      undefined
    )
  })

  it("preserves an explicit manual command while recovery is pending", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const second = makeBot(storage, 2, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(
      messageUpdate(`/${BOT_COMMANDS.MANUAL}`, { updateId: 2 })
    )

    assert.equal(telegram.byMethod("sendMessage").length, 1)
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      MANUAL_COMMAND_UNAVAILABLE_TEXT
    )
    assert.equal(
      storage.read("101/201")?.interactionState?.pendingRecovery,
      undefined
    )
  })

  it("resets active history whose stored access identity is unknown", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(() => [ROLES.USER])
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    const saved = storage.read("101/201")!
    if (saved.interactionState) {
      delete saved.interactionState.accessKey
    }
    storage.write("101/201", saved)

    const second = makeBot(storage, 1, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("stale answer", { updateId: 2 }))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_ACCESS_INTERRUPTED
    )
  })

  it("serializes concurrent updates for one session", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    let roles = [ROLES.USER]
    const auth = currentIdentityAuth(() => roles)
    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))

    roles = [ROLES.USER, ROLES.EDITOR]
    const second = makeBot(storage, 1, auth)
    const telegram = installTelegramApiRecorder(second)
    await Promise.all([
      second.handleUpdate(messageUpdate("first", { updateId: 2 })),
      second.handleUpdate(messageUpdate("second", { updateId: 3 })),
    ])

    assert.equal(
      telegram
        .byMethod("sendMessage")
        .filter((call) => call.payload.text === BOT_TEXTS.RECOVERY_ACCESS_INTERRUPTED)
        .length,
      1
    )
  })

  it("does not submit an interrupted consent answer after access changes", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    let roles = [ROLES.USER]
    const auth = currentIdentityAuth(() => roles)
    storage.write("101/201", {
      hasTermsAgreement: false,
      quizAnswers: { preserved: { answer: "yes" } } as never,
      interactionState: { conversationVersion: 1 },
    })

    const first = makeBot(storage, 1, auth)
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate(`/${BOT_COMMANDS.TERMS_AGREEMENT}`))

    roles = [ROLES.USER, ROLES.EDITOR]
    const second = makeBot(storage, 1, auth)
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("Принимаю", { updateId: 2 }))

    const session = storage.read("101/201")
    assert.equal(session?.hasTermsAgreement, false)
    assert.deepEqual(session?.quizAnswers, {
      preserved: { answer: "yes" },
    })
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_ACCESS_INTERRUPTED
    )
  })

  it("allows different session keys to progress concurrently", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    let active = 0
    let maxActive = 0
    const auth: MiddlewareFn<MyContext> = async (ctx, next) => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 20))
      const user = makeUser({ roles: [ROLES.USER] })
      Object.assign(ctx.session, { token: "test-token", user })
      await next()
      active--
    }
    const bot = makeBot(storage, 1, auth)
    installTelegramApiRecorder(bot)

    await Promise.all([
      bot.handleUpdate(messageUpdate("first", { updateId: 1 })),
      bot.handleUpdate(
        messageUpdate("second", {
          updateId: 2,
          chat: {
            id: 301,
            type: "private",
            first_name: "Other",
          },
        })
      ),
    ])

    assert.equal(maxActive, 2)
    assert.ok(storage.read("101/201"))
    assert.ok(storage.read("101/301"))
  })

  it("shows a safe psychologist section when the profile is missing", async () => {
    const storage = new CloningSessionStorage<SessionData>()
    const auth = currentIdentityAuth(
      () => [ROLES.USER, ROLES.PSYCHOLOGIST],
      { missingPsychologist: true }
    )
    const bot = makeBot(storage, 1, auth)
    const telegram = installTelegramApiRecorder(bot)

    await bot.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MENU}`))
    await bot.handleUpdate(messageUpdate("Мои клиенты", { updateId: 2 }))

    assert.equal(
      telegram
        .byMethod("sendMessage")
        .some(
          (call) =>
            call.payload.text === BOT_TEXTS.PSYCHOLOGIST_PROFILE_MISSING
        ),
      true
    )
  })
})
