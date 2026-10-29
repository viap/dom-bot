import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createTelegramContactLinkMiddleware,
  getTelegramContactStartToken,
} from "@/common/middlewares/telegramContactLink"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { createTestBot } from "../helpers/createTestBot"
import { callbackUpdate, messageUpdate } from "../helpers/telegram"

function context(text: string, chatType = "private") {
  return {
    message: { text },
    chat: { type: chatType },
    me: { username: "dom_bot" },
  } as never
}

describe("telegram contact link parser", () => {
  it("renders each contact-link result sentence on its own line", () => {
    assert.equal(BOT_TEXTS.TELEGRAM_CONTACT_LINKED.split("\n").length, 2)
    assert.equal(
      BOT_TEXTS.TELEGRAM_CONTACT_ALREADY_LINKED.split("\n").length,
      2
    )
    assert.equal(BOT_TEXTS.TELEGRAM_CONTACT_LINK_FAILED.split("\n").length, 2)
  })

  it("extracts a valid private application link token", () => {
    const token = "a".repeat(43)
    assert.equal(
      getTelegramContactStartToken(context(`/start app_${token}`)),
      token
    )
  })

  it("accepts a link addressed to this bot", () => {
    const token = "b".repeat(43)
    assert.equal(
      getTelegramContactStartToken(context(`/start@dom_bot app_${token}`)),
      token
    )
  })

  it("rejects group links, other bots, and malformed tokens", () => {
    const token = "c".repeat(43)
    assert.equal(
      getTelegramContactStartToken(context(`/start app_${token}`, "group")),
      undefined
    )
    assert.equal(
      getTelegramContactStartToken(context(`/start@another_bot app_${token}`)),
      undefined
    )
    assert.equal(
      getTelegramContactStartToken(context("/start app_short")),
      undefined
    )
  })

  it("requires an explicit callback before confirming a contact link", async () => {
    const token = "d".repeat(43)
    const confirmations: Array<Record<string, unknown>> = []
    const middleware = createTelegramContactLinkMiddleware({
      confirm: async (startToken, privateChatId, telegram) => {
        confirmations.push({ startToken, privateChatId, telegram })
        return { status: "linked" }
      },
    })
    const { bot, telegram } = await createTestBot({
      telegramLinkMiddleware: middleware,
    })

    await bot.handleUpdate(messageUpdate(`/start app_${token}`))
    assert.equal(confirmations.length, 0)
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.TELEGRAM_CONTACT_CONFIRM
    )

    await bot.handleUpdate(
      callbackUpdate(`appcontact:confirm:${token}`, { updateId: 2 })
    )
    assert.equal(confirmations.length, 1)
    assert.deepEqual(confirmations[0], {
      startToken: token,
      privateChatId: "201",
      telegram: {
        id: "101",
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "test_user",
        language_code: "ru",
      },
    })
    assert.equal(
      telegram.byMethod("sendMessage")[1].payload.text,
      BOT_TEXTS.TELEGRAM_CONTACT_LINKED
    )
  })

  it("cancels a pending contact link without confirming it", async () => {
    const token = "e".repeat(43)
    const cancelled: Array<string> = []
    let confirmations = 0
    const middleware = createTelegramContactLinkMiddleware({
      confirm: async () => {
        confirmations++
        return { status: "linked" }
      },
      cancel: async (startToken) => {
        cancelled.push(startToken)
        return { status: "cancelled" }
      },
    })
    const { bot, telegram } = await createTestBot({
      telegramLinkMiddleware: middleware,
    })

    await bot.handleUpdate(
      callbackUpdate(`appcontact:cancel:${token}`, { updateId: 2 })
    )

    assert.deepEqual(cancelled, [token])
    assert.equal(confirmations, 0)
    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.TELEGRAM_CONTACT_CANCELLED
    )
  })
})
