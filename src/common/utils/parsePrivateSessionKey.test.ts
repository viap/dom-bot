import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parsePrivateSessionKey } from "@/common/utils/parsePrivateSessionKey"

describe("parsePrivateSessionKey", () => {
  it("accepts a canonical private Telegram session", () => {
    assert.deepEqual(parsePrivateSessionKey("123456789/123456789"), {
      telegramUserId: "123456789",
      privateChatId: "123456789",
    })
  })

  it("rejects group sessions", () => {
    assert.equal(parsePrivateSessionKey("123456789/987654321"), null)
  })

  it("rejects channel and supergroup-style negative chat ids", () => {
    assert.equal(parsePrivateSessionKey("123456789/-100123456789"), null)
  })

  it("rejects malformed and missing segments", () => {
    assert.equal(parsePrivateSessionKey("123456789"), null)
    assert.equal(parsePrivateSessionKey("123456789/123456789/extra"), null)
    assert.equal(parsePrivateSessionKey("/"), null)
  })

  it("rejects non-canonical numeric ids", () => {
    assert.equal(parsePrivateSessionKey("user/chat"), null)
    assert.equal(parsePrivateSessionKey("0/0"), null)
    assert.equal(parsePrivateSessionKey("01/01"), null)
    assert.equal(parsePrivateSessionKey("+1/+1"), null)
  })
})
