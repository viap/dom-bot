import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { redactSecrets } from "./apiClient"

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
