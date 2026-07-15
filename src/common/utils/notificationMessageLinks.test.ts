import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  offsetNotificationMessageEntities,
  sanitizeNotificationMessageEntities,
} from "./notificationMessageEntities"
import { parseNotificationMessageLinks } from "./parseNotificationMessageLinks"

describe("notification message links", () => {
  it("parses multiple markdown fallback links", () => {
    const result = parseNotificationMessageLinks(
      "check [one](https://a.com) | [two](https://b.com)"
    )

    assert.equal(result.text, "check one | two")
    assert.deepEqual(result.entities, [
      { type: "text_link", offset: 6, length: 3, url: "https://a.com" },
      { type: "text_link", offset: 12, length: 3, url: "https://b.com" },
    ])
  })

  it("supports balanced parentheses inside markdown fallback urls", () => {
    const url = "https://en.wikipedia.org/wiki/Foo_(bar)"
    const result = parseNotificationMessageLinks(`[wiki](${url})`)

    assert.equal(result.text, "wiki")
    assert.deepEqual(result.entities, [
      { type: "text_link", offset: 0, length: 4, url },
    ])
  })

  it("preserves invalid and unfinished markdown links as plain text", () => {
    const message =
      "bad [link](javascript:alert(1)) and [open](https://example.com"
    const result = parseNotificationMessageLinks(message)

    assert.equal(result.text, message)
    assert.deepEqual(result.entities, [])
  })

  it("leaves messages without links unchanged", () => {
    const result = parseNotificationMessageLinks("plain * _ ! text")

    assert.equal(result.text, "plain * _ ! text")
    assert.deepEqual(result.entities, [])
  })

  it("sanitizes telegram-native link entities", () => {
    const result = sanitizeNotificationMessageEntities("Текст и ссылка", [
      { type: "text_link", offset: 8, length: 6, url: "https://example.com" },
      { type: "url", offset: 0, length: 5 },
      { type: "bold", offset: 0, length: 5 },
      { type: "text_link", offset: 8, length: 6, url: "javascript:alert(1)" },
      { type: "text_link", offset: 99, length: 6, url: "https://example.com" },
    ])

    assert.deepEqual(result, [
      { type: "text_link", offset: 8, length: 6, url: "https://example.com" },
    ])
  })

  it("keeps valid raw url entities", () => {
    const message = "open https://example.com"
    const result = sanitizeNotificationMessageEntities(message, [
      { type: "url", offset: 5, length: 19 },
    ])

    assert.deepEqual(result, [{ type: "url", offset: 5, length: 19 }])
  })

  it("offsets entities after the title prefix", () => {
    const result = offsetNotificationMessageEntities(
      [{ type: "text_link", offset: 8, length: 6, url: "https://example.com" }],
      "Заголовок:\r\n\r\n".length
    )

    assert.deepEqual(result, [
      { type: "text_link", offset: 22, length: 6, url: "https://example.com" },
    ])
  })
})

