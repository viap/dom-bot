import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MemorySessionStorage } from "grammy"
import { createDomBot } from "@/createDomBot"
import { SessionData } from "@/common/types/sessionData"
import {
  setDefaultBotCommands,
  startNotificationListener,
} from "@/startup"
import { installTelegramApiRecorder } from "../helpers/telegram"

describe("startup side effects", () => {
  it("does not reject bot construction when default command sync fails", async () => {
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
      sessionStorage: new MemorySessionStorage<SessionData>(),
      authMiddleware: async (_ctx, next) => next(),
    })
    bot.api.config.use(async () => {
      throw new Error("telegram unavailable")
    })
    const originalError = console.error
    const errors: Array<unknown> = []
    console.error = (...args: Array<unknown>) => {
      errors.push(args)
    }

    try {
      await assert.doesNotReject(() => setDefaultBotCommands(bot))
    } finally {
      console.error = originalError
    }

    assert.equal(errors.length, 1)
  })

  it("does not reject startup when notification listener fails", async () => {
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
      sessionStorage: new MemorySessionStorage<SessionData>(),
      authMiddleware: async (_ctx, next) => next(),
    })
    installTelegramApiRecorder(bot)
    const originalError = console.error
    const errors: Array<unknown> = []
    console.error = (...args: Array<unknown>) => {
      errors.push(args)
    }

    try {
      await assert.doesNotReject(() =>
        startNotificationListener(bot, {} as never, async () => {
          throw new Error("socket unavailable")
        })
      )
    } finally {
      console.error = originalError
    }

    assert.equal(errors.length, 1)
  })
})
