import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getTelegramContactStartToken } from "@/common/middlewares/telegramContactLink"
import { BOT_TEXTS } from "@/common/enums/botTexts"

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
})
