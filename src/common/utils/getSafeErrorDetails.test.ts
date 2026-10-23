import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { AxiosError } from "axios"
import { GrammyError } from "grammy"
import { getSafeErrorDetails } from "./getSafeErrorDetails"

describe("getSafeErrorDetails", () => {
  it("drops the axios request body and headers", () => {
    const error = new AxiosError("Request failed", "ERR_BAD_RESPONSE", {
      url: "/auth/login/telegram",
      data: '{"apiClient":{"password":"secret"}}',
      headers: { Authorization: "Bearer jwt" },
    } as never)

    const details = JSON.stringify(getSafeErrorDetails(error))

    assert.ok(!details.includes("secret"))
    assert.ok(!details.includes("jwt"))
    assert.ok(details.includes("/auth/login/telegram"))
  })

  it("drops the Telegram payload with chat id and text", () => {
    const error = new GrammyError(
      "Call to 'sendMessage' failed!",
      { ok: false, error_code: 403, description: "Forbidden: bot was blocked" },
      "sendMessage",
      { chat_id: 123456, text: "therapy details" }
    )

    const details = getSafeErrorDetails(error)

    assert.deepEqual(details, {
      message: "Forbidden: bot was blocked",
      status: 403,
      method: "sendMessage",
    })
  })

  it("masks a bot token in error messages", () => {
    const details = getSafeErrorDetails(
      new Error(
        "request to https://api.telegram.org/bot123:ABC-def/getMe failed"
      )
    )

    assert.ok(!details.message.includes("123:ABC-def"))
  })
})
