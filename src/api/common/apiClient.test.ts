import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { redactSecrets, shouldLogDevRequest } from "./apiClient"

describe("redactSecrets", () => {
  it("masks passwords and tokens at any depth", () => {
    assert.deepEqual(
      redactSecrets({
        apiClient: { name: "domBot", password: "secret" },
        telegram: { id: "1" },
        auth_token: "jwt",
        list: [{ token: "jwt" }],
      }),
      {
        apiClient: { name: "domBot", password: "***" },
        telegram: { id: "1" },
        auth_token: "***",
        list: [{ token: "***" }],
      }
    )
  })
})

describe("shouldLogDevRequest", () => {
  it("silences only routine application-message claims", () => {
    assert.equal(
      shouldLogDevRequest("http://localhost:3003/application-messages/claim"),
      false
    )
    assert.equal(
      shouldLogDevRequest("/application-messages/claim?worker=bot"),
      false
    )
    assert.equal(
      shouldLogDevRequest("http://localhost:3003/application-messages/report"),
      true
    )
    assert.equal(shouldLogDevRequest(undefined), true)
  })
})
