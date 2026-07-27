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
      await bot.handleUpdate(callbackUpdate(JSON.stringify({ unexpected: true })))
    } finally {
      console.log = originalLog
    }

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 1)
  })

  it("characterizes invalid callback JSON as returning without answerCallbackQuery", async () => {
    const { bot, telegram } = await createTestBot()

    await bot.handleUpdate(callbackUpdate("{bad json"))

    assert.equal(telegram.byMethod("answerCallbackQuery").length, 0)
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
          username: "dom_test_bot",
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
})
