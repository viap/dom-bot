import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MemorySessionStorage } from "grammy"
import { createDomBot } from "@/createDomBot"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { ROLES } from "@/common/enums/roles"
import { SessionData } from "@/common/types/sessionData"
import {
  EDITOR_MANUAL_LINK,
  MANUAL_COMMAND_UNAVAILABLE_TEXT,
  PSYCHOLOGIST_MANUAL_LINK,
} from "@/common/utils/manualCommand"
import { createTestBot } from "../helpers/createTestBot"
import {
  callbackUpdate,
  installTelegramApiRecorder,
  makePrivateChat,
  messageUpdate,
} from "../helpers/telegram"

describe("bot handlers", () => {
  it("handles application links before bot authentication", async () => {
    let authCalls = 0
    let linkCalls = 0
    const { bot, telegram } = await createTestBot({
      authMiddleware: async (_ctx, next) => {
        authCalls++
        return next()
      },
      telegramLinkMiddleware: async (ctx, next) => {
        if (ctx.message?.text?.includes("app_")) {
          linkCalls++
          await ctx.reply(BOT_TEXTS.TELEGRAM_CONTACT_LINKED)
          return
        }
        return next()
      },
    })

    await bot.handleUpdate(
      messageUpdate(`/start app_${"a".repeat(43)}`, {
        chat: makePrivateChat({ id: 101 }),
        message: {
          entities: [{ type: "bot_command", offset: 0, length: 6 }],
        },
      })
    )

    assert.equal(linkCalls, 1)
    assert.equal(authCalls, 0)
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.TELEGRAM_CONTACT_LINKED
    )
  })

  it("handles application replies before bot authentication", async () => {
    let authCalls = 0
    let replyCalls = 0
    const { bot, telegram } = await createTestBot({
      authMiddleware: async (_ctx, next) => {
        authCalls++
        return next()
      },
      applicationReplyMiddleware: async (ctx) => {
        replyCalls++
        await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_RECEIVED)
      },
    })

    await bot.handleUpdate(messageUpdate("Applicant reply"))

    assert.equal(replyCalls, 1)
    assert.equal(authCalls, 0)
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.APPLICATION_REPLY_RECEIVED
    )
  })

  it("/start exits flow, syncs role-aware commands, and replies with menu", async () => {
    const { bot, telegram } = await createTestBot({
      roles: [ROLES.EDITOR],
    })

    await bot.handleUpdate(messageUpdate(`/${BOT_COMMANDS.START}`))

    const commandCalls = telegram.byMethod("setMyCommands")
    const messages = telegram.byMethod("sendMessage")

    assert.equal(commandCalls.length, 1)
    assert.deepEqual(commandCalls[0].payload.scope, {
      type: "chat",
      chat_id: 201,
    })
    assert.equal(messages.length, 1)
    assert.equal(messages[0].payload.text, BOT_TEXTS.WELCOME)
    assert.ok(messages[0].payload.reply_markup)
  })

  it("/manual replies with both role instructions for combined-role users", async () => {
    const { bot, telegram } = await createTestBot({
      roles: [ROLES.EDITOR, ROLES.PSYCHOLOGIST],
    })

    await bot.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MANUAL}`))

    const messages = telegram.byMethod("sendMessage")
    assert.equal(messages.length, 1)
    assert.equal(
      messages[0].payload.text,
      [
        `Инструкция для редакторов: ${EDITOR_MANUAL_LINK}`,
        `Инструкция для психологов: ${PSYCHOLOGIST_MANUAL_LINK}`,
      ].join("\r\n\r\n")
    )
  })

  it("/manual returns unavailable text for ineligible users", async () => {
    const { bot, telegram } = await createTestBot({ roles: [ROLES.USER] })

    await bot.handleUpdate(messageUpdate(`/${BOT_COMMANDS.MANUAL}`))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      MANUAL_COMMAND_UNAVAILABLE_TEXT
    )
  })

  it("default message replies with escaped MarkdownV2 echo and reload command", async () => {
    const { bot, telegram } = await createTestBot()

    await bot.handleUpdate(messageUpdate("hello _ * [world]"))

    const messages = telegram.byMethod("sendMessage")
    assert.equal(messages.length, 1)
    assert.equal(
      messages[0].payload.text,
      `Получил сообщение \\- *hello \\_ \\* \\[world\\]*\r\nПопробуйте перезагрузить /start`
    )
    assert.equal(messages[0].payload.parse_mode, "MarkdownV2")
  })

  it("answers callback queries with unknown but valid JSON payloads", async () => {
    const { bot, telegram } = await createTestBot()
    const originalLog = console.log
    console.log = () => undefined

    try {
      await bot.handleUpdate(
        callbackUpdate(JSON.stringify({ unexpected: true }))
      )
    } finally {
      console.log = originalLog
    }

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
  })

  it("acknowledges invalid callback JSON before returning", async () => {
    const { bot, telegram } = await createTestBot()

    await bot.handleUpdate(callbackUpdate("{bad json"))

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
  })

  it("ignores commands addressed to another bot", async () => {
    const { bot, telegram } = await createTestBot()

    await bot.handleUpdate(messageUpdate("/menu@another_bot"))

    assert.equal(telegram.byMethod("sendMessage").length, 0)
  })

  it("ignores unsupported updates without a user or chat session key", async () => {
    const { bot, telegram } = await createTestBot()

    await bot.handleUpdate({
      update_id: 1,
      inline_query: {
        id: "inline-1",
        from: { id: 123, is_bot: true, first_name: "Bot" },
        query: "test",
        offset: "",
      },
    })

    assert.equal(telegram.calls.length, 0)
  })

  it("persists and isolates sessions through factory session middleware", async () => {
    const storage = new MemorySessionStorage<SessionData>()
    const seenTokens: Array<string | undefined> = []
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
      authMiddleware: async (ctx, next) => {
        seenTokens.push(ctx.session.token)
        Object.assign(ctx.session, {
          token: ctx.session.token || `token-${ctx.chat?.id}`,
        })
        return next()
      },
    })
    installTelegramApiRecorder(bot)

    await bot.handleUpdate(messageUpdate("first", { updateId: 1 }))
    await bot.handleUpdate(messageUpdate("second", { updateId: 2 }))
    await bot.handleUpdate(
      messageUpdate("third", {
        updateId: 3,
        chat: makePrivateChat({ id: 301 }),
      })
    )

    assert.deepEqual(seenTokens, [undefined, "token-201", undefined])
  })

  it("retries role-aware command synchronization after a Telegram failure", async () => {
    const storage = new MemorySessionStorage<SessionData>()
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
      authMiddleware: async (ctx, next) => {
        Object.assign(ctx.session, {
          token: "token",
          user: {
            _id: "user-1",
            name: "User",
            descr: "",
            roles: [ROLES.USER],
            contacts: [],
          },
        })
        await next()
      },
    })
    let failed = false
    const telegram = installTelegramApiRecorder(bot, {
      fail: (call) => {
        if (call.method === "deleteMyCommands" && !failed) {
          failed = true
          return new Error("sync failed")
        }
        return undefined
      },
    })
    const originalError = console.error
    console.error = () => undefined
    try {
      await bot.handleUpdate(messageUpdate("first", { updateId: 1 }))
      await bot.handleUpdate(messageUpdate("second", { updateId: 2 }))
    } finally {
      console.error = originalError
    }

    assert.equal(telegram.byMethod("deleteMyCommands").length, 2)
    assert.ok((await storage.read("101/201"))?.syncedCommandsKey)
  })
})
