import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { autoRetry } from "@grammyjs/auto-retry"
import { HttpError } from "grammy"
import { AUTO_RETRY_OPTIONS } from "@/createDomBot"

type Prev = Parameters<ReturnType<typeof autoRetry>>[0]

function run(responses: Array<() => unknown>) {
  let calls = 0
  const prev = (async () => {
    const next = responses[Math.min(calls, responses.length - 1)]
    calls += 1
    return next()
  }) as unknown as Prev
  const transformer = autoRetry(AUTO_RETRY_OPTIONS)
  return {
    result: transformer(prev, "sendMessage", {} as never),
    calls: () => calls,
  }
}

describe("bot auto-retry options", () => {
  it("retries a 429 with retry_after", async () => {
    const { result, calls } = run([
      () => ({ ok: false, error_code: 429, parameters: { retry_after: 0 } }),
      () => ({ ok: true, result: true }),
    ])

    assert.deepEqual(await result, { ok: true, result: true })
    assert.equal(calls(), 2)
  })

  it("rethrows network errors instead of retrying them", async () => {
    const { result, calls } = run([
      () => {
        throw new HttpError("Network request failed", new Error("timeout"))
      },
    ])

    await assert.rejects(result, HttpError)
    assert.equal(calls(), 1)
  })

  it("does not retry Telegram server errors", async () => {
    const { result, calls } = run([
      () => ({ ok: false, error_code: 502, description: "Bad Gateway" }),
    ])

    const response = (await result) as { error_code?: number }
    assert.equal(response.error_code, 502)
    assert.equal(calls(), 1)
  })
})
