import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  getSessionKey,
  sessionInit,
} from "@/createDomBot"
import { syncRoleAwareBotCommands } from "@/common/middlewares/roleAwareCommands"
import {
  acknowledgeCallback,
  handleCallbackData,
  parseCallbackData,
} from "@/common/utils/callbackRouting"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { ROLES } from "@/common/enums/roles"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { makeUser } from "../helpers/fixtures"

describe("dom bot factory helpers", () => {
  it("creates fresh default session objects", () => {
    const first = sessionInit()
    const second = sessionInit()

    first.quizAnswers["quiz-1"] = { answer: "yes" } as never

    assert.equal(first.hasTermsAgreement, true)
    assert.equal(second.hasTermsAgreement, true)
    assert.notEqual(first, second)
    assert.deepEqual(second.quizAnswers, {})
  })

  it("uses per-user-per-chat session keys", () => {
    assert.equal(
      getSessionKey({
        from: { id: 101 },
        chat: { id: 202 },
      } as never),
      "101/202"
    )
    assert.equal(getSessionKey({ from: { id: 101 } } as never), undefined)
    assert.equal(getSessionKey({ chat: { id: 202 } } as never), undefined)
  })

  it("sets role-aware commands for eligible private-chat users", async () => {
    const calls: Array<{ method: string; payload: unknown }> = []
    const ctx = {
      chat: { id: 202, type: "private" },
      session: {
        user: makeUser({ roles: [ROLES.EDITOR, ROLES.PSYCHOLOGIST] }),
      },
      api: {
        setMyCommands: async (...payload: Array<unknown>) => {
          calls.push({ method: "setMyCommands", payload })
          return true
        },
        deleteMyCommands: async (...payload: Array<unknown>) => {
          calls.push({ method: "deleteMyCommands", payload })
          return true
        },
      },
    }

    await syncRoleAwareBotCommands(ctx as never)

    assert.equal(calls.length, 1)
    assert.equal(calls[0].method, "setMyCommands")
    assert.deepEqual((calls[0].payload as Array<unknown>)[1], {
      scope: { type: "chat", chat_id: 202 },
    })
  })

  it("deletes private-chat commands for users without manual access", async () => {
    const calls: Array<{ method: string; payload: unknown }> = []
    const ctx = {
      chat: { id: 202, type: "private" },
      session: {
        user: makeUser({ roles: [ROLES.USER] }),
      },
      api: {
        setMyCommands: async (...payload: Array<unknown>) => {
          calls.push({ method: "setMyCommands", payload })
          return true
        },
        deleteMyCommands: async (...payload: Array<unknown>) => {
          calls.push({ method: "deleteMyCommands", payload })
          return true
        },
      },
    }

    await syncRoleAwareBotCommands(ctx as never)

    assert.deepEqual(calls, [
      {
        method: "deleteMyCommands",
        payload: [{ scope: { type: "chat", chat_id: 202 } }],
      },
    ])
  })

  it("parses valid callback data and ignores invalid callback data", () => {
    assert.deepEqual(parseCallbackData(JSON.stringify({ command: "menu" })), {
      command: "menu",
    })
    assert.equal(parseCallbackData("{bad json"), undefined)
  })

  it("routes menu and terms callback commands to their conversations", async () => {
    const reentered: Array<CONVERSATION_NAMES> = []
    const ctx = {
      callbackQuery: { data: "" },
      conversation: {
        reenter: async (name: CONVERSATION_NAMES) => {
          reentered.push(name)
        },
      },
    }

    assert.equal(
      await handleCallbackData(ctx as never, { command: BOT_COMMANDS.MENU }),
      true
    )
    assert.equal(
      await handleCallbackData(ctx as never, {
        command: BOT_COMMANDS.TERMS_AGREEMENT,
      }),
      true
    )

    assert.deepEqual(reentered, [
      CONVERSATION_NAMES.SELECT_MENU_ITEM,
      CONVERSATION_NAMES.TERMS_AGREEMENT,
    ])
  })

  it("acknowledges callbacks separately from routing", async () => {
    let answers = 0
    await acknowledgeCallback({
      callbackQuery: { data: "" },
      answerCallbackQuery: async () => {
        answers++
      },
    } as never)

    assert.equal(answers, 1)
  })

  it("stores therapy-request deep links in the current session", async () => {
    const reentered: Array<CONVERSATION_NAMES> = []
    const ctx = {
      callbackQuery: { data: "" },
      session: {},
      conversation: {
        reenter: async (name: CONVERSATION_NAMES) => {
          reentered.push(name)
        },
      },
      answerCallbackQuery: async () => undefined,
    }

    assert.equal(
      await handleCallbackData(ctx as never, {
        goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW,
      }),
      true
    )

    assert.deepEqual(reentered, [CONVERSATION_NAMES.SELECT_MENU_ITEM])
    assert.deepEqual(ctx.session, {
      menuDeepLink: { goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW },
    })
  })

  it("reports unsupported callbacks without claiming them", async () => {
    const originalLog = console.log
    console.log = () => undefined
    try {
      assert.equal(
        await handleCallbackData(
          { callbackQuery: { data: "unsupported" } } as never,
          { command: "unsupported" }
        ),
        false
      )
    } finally {
      console.log = originalLog
    }
  })
})
