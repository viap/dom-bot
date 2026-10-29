import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  deliverClaimedApplicationMessage,
  flushApplicationMessageReport,
  runApplicationMessageCycle,
} from "@/components/ApplicationMessageListener/applicationMessageListener"
import {
  createApplicationMessageReplyMiddleware,
  formatApplicationThreadTranscript,
  getApplicationReplyPayload,
} from "@/common/middlewares/applicationMessageReply"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { ROLES } from "@/common/enums/roles"
import {
  APPLICATION_THREADS_BUTTON_TEXT,
  applicationReplyCallback,
  parseApplicationMessageAction,
} from "@/common/utils/applicationMessaging"
import { getMenuForCurrentProfile } from "@/conversations/others/selectMenuItem"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { createTestBot } from "../helpers/createTestBot"
import { makeUser } from "../helpers/fixtures"
import { callbackUpdate, messageUpdate } from "../helpers/telegram"
import { GrammyError, HttpError } from "grammy"

const applicationId = "507f1f77bcf86cd799439031"

const thread = {
  applicationId,
  formType: "event_registration",
  sourceEntityType: "event",
  createdAt: "2026-10-28T08:00:00.000Z",
  lastMessageAt: "2026-10-28T09:00:00.000Z",
}

describe("application Telegram messaging", () => {
  it("delivers one claimed message and reports its Telegram message id", async () => {
    const reports: Array<Record<string, unknown>> = []
    let replyMarkup: unknown
    const bot = {
      api: {
        sendMessage: async (
          chatId: string,
          text: string,
          options?: { reply_markup?: unknown }
        ) => {
          assert.equal(chatId, "42")
          assert.equal(text, "DOM — Editor Jane\n\nHello")
          replyMarkup = options?.reply_markup
          return { message_id: 101 }
        },
      },
    }

    await deliverClaimedApplicationMessage(
      bot as never,
      {
        id: "507f1f77bcf86cd799439088",
        applicationId,
        privateChatId: "42",
        text: "DOM — Editor Jane\n\nHello",
      },
      async (report) => {
        reports.push(report)
      }
    )

    assert.deepEqual(reports, [
      {
        messageId: "507f1f77bcf86cd799439088",
        status: "sent",
        telegramMessageId: 101,
      },
    ])
    assert.deepEqual(
      (replyMarkup as { inline_keyboard: unknown }).inline_keyboard,
      [
        [
          {
            text: "Ответить",
            callback_data: applicationReplyCallback(applicationId),
          },
        ],
        [
          {
            text: APPLICATION_THREADS_BUTTON_TEXT,
            callback_data: "appmsg:threads:0",
          },
        ],
      ]
    )
  })

  it("retries only the sent report after Telegram delivery succeeds", async () => {
    let sends = 0
    let reports = 0
    const waits: Array<number> = []
    const bot = {
      api: {
        sendMessage: async () => {
          sends++
          return { message_id: 101 }
        },
      },
    }

    await deliverClaimedApplicationMessage(
      bot as never,
      {
        id: "507f1f77bcf86cd799439088",
        applicationId,
        privateChatId: "42",
        text: "Hello",
      },
      async () => {
        reports++
        if (reports < 3) throw new Error("report unavailable")
      },
      async (delay) => {
        waits.push(delay)
      }
    )

    assert.equal(sends, 1)
    assert.equal(reports, 3)
    assert.deepEqual(waits, [250, 1_000])
  })

  it("returns an unsent delivery report for the polling loop to retry", async () => {
    const bot = {
      api: { sendMessage: async () => ({ message_id: 101 }) },
    }

    const pending = await deliverClaimedApplicationMessage(
      bot as never,
      {
        id: "507f1f77bcf86cd799439088",
        applicationId,
        privateChatId: "42",
        text: "Hello",
      },
      async () => {
        throw new Error("report unavailable")
      },
      async () => undefined
    )

    assert.deepEqual(pending, {
      messageId: "507f1f77bcf86cd799439088",
      status: "sent",
      telegramMessageId: 101,
    })
  })

  it("clears successful and permanently rejected pending reports", async () => {
    const report = {
      messageId: "507f1f77bcf86cd799439088",
      status: "sent",
      telegramMessageId: 101,
    } as const
    let reportCalls = 0

    assert.equal(
      await flushApplicationMessageReport(report, async () => {
        reportCalls += 1
      }),
      undefined
    )

    const originalError = console.error
    const logged: Array<unknown> = []
    console.error = (...args: Array<unknown>) => logged.push(args)
    try {
      for (const status of [400, 404, 409, 410, 422]) {
        assert.equal(
          await flushApplicationMessageReport(report, async () => {
            reportCalls += 1
            throw Object.assign(new Error("Rejected"), {
              isAxiosError: true,
              response: { status },
            })
          }),
          undefined
        )
      }
    } finally {
      console.error = originalError
    }

    assert.equal(reportCalls, 6)
    assert.deepEqual(logged[0], [
      "[ApplicationMessageListener] delivery report rejected permanently:",
      {
        httpStatus: 400,
        messageId: report.messageId,
        status: report.status,
      },
    ])
  })

  it("retains pending reports after retryable 4xx, API 5xx, and transport failures", async () => {
    const report = {
      messageId: "507f1f77bcf86cd799439088",
      status: "sent",
      telegramMessageId: 101,
    } as const

    for (const error of [
      ...[401, 403, 408, 429].map((status) =>
        Object.assign(new Error("Retryable rejection"), {
          isAxiosError: true,
          response: { status },
        })
      ),
      Object.assign(new Error("Unavailable"), {
        isAxiosError: true,
        response: { status: 503 },
      }),
      Object.assign(new Error("Connection reset"), {
        isAxiosError: true,
      }),
    ]) {
      await assert.rejects(
        flushApplicationMessageReport(report, async () => {
          throw error
        })
      )
    }
  })

  it("keeps retryable cycle reports pending before resuming the queue", async () => {
    const report = {
      messageId: "507f1f77bcf86cd799439088",
      status: "sent",
      telegramMessageId: 101,
    } as const
    const originalError = console.error
    console.error = () => undefined

    try {
      for (const error of [
        Object.assign(new Error("Unauthorized"), {
          isAxiosError: true,
          response: { status: 401 },
        }),
        Object.assign(new Error("Timed out"), {
          isAxiosError: true,
          response: { status: 408 },
        }),
        Object.assign(new Error("Unavailable"), {
          isAxiosError: true,
          response: { status: 503 },
        }),
        Object.assign(new Error("Connection reset"), {
          isAxiosError: true,
        }),
      ]) {
        let claimCalls = 0
        let deliveryCalls = 0
        const retry = await runApplicationMessageCycle(
          {} as never,
          { pendingReport: report, consecutiveFailures: 0 },
          {
            claim: async () => {
              claimCalls += 1
              return { enabled: true, message: null }
            },
            report: async () => {
              throw error
            },
            deliver: async () => {
              deliveryCalls += 1
              return undefined
            },
            pollingDelay: 5_000,
          }
        )
        assert.deepEqual(retry, {
          pendingReport: report,
          consecutiveFailures: 1,
          nextDelay: 5_000,
        })
        assert.equal(claimCalls, 0)
        assert.equal(deliveryCalls, 0)
      }

      let claimCalls = 0
      let deliveryCalls = 0
      const recoveredDependencies = {
        claim: async () => {
          claimCalls += 1
          return { enabled: true, message: null }
        },
        report: async () => undefined,
        deliver: async () => {
          deliveryCalls += 1
          return undefined
        },
        pollingDelay: 5_000,
      }

      const cleared = await runApplicationMessageCycle(
        {} as never,
        { pendingReport: report, consecutiveFailures: 1 },
        recoveredDependencies
      )
      assert.deepEqual(cleared, {
        pendingReport: undefined,
        consecutiveFailures: 0,
        nextDelay: 1_000,
      })
      assert.equal(claimCalls, 0)
      assert.equal(deliveryCalls, 0)

      const resumed = await runApplicationMessageCycle(
        {} as never,
        cleared,
        recoveredDependencies
      )
      assert.equal(resumed.pendingReport, undefined)
      assert.equal(claimCalls, 1)
      assert.equal(deliveryCalls, 0)
    } finally {
      console.error = originalError
    }
  })

  it("does not queue or resend after a permanent report rejection", async () => {
    let sends = 0
    let reports = 0
    const bot = {
      api: {
        sendMessage: async () => {
          sends += 1
          return { message_id: 101 }
        },
      },
    }
    const originalError = console.error
    console.error = () => undefined
    try {
      const pending = await deliverClaimedApplicationMessage(
        bot as never,
        {
          id: "507f1f77bcf86cd799439088",
          applicationId,
          privateChatId: "42",
          text: "Hello",
        },
        async () => {
          reports += 1
          throw Object.assign(new Error("Conflict"), {
            isAxiosError: true,
            response: { status: 409 },
          })
        }
      )

      assert.equal(pending, undefined)
    } finally {
      console.error = originalError
    }

    assert.equal(sends, 1)
    assert.equal(reports, 1)
  })

  it("classifies definitive Telegram failures separately from unknown delivery", async () => {
    for (const [error, expectedStatus, expectedCode] of [
      [
        new GrammyError(
          "Too many requests",
          {
            ok: false,
            error_code: 429,
            description: "Too many requests",
            parameters: { retry_after: 1 },
          },
          "sendMessage",
          {}
        ),
        "failed",
        "telegram_429",
      ],
      [
        new GrammyError(
          "Server error",
          {
            ok: false,
            error_code: 500,
            description: "Server error",
            parameters: {},
          },
          "sendMessage",
          {}
        ),
        "unknown",
        "delivery_transport_unknown",
      ],
      [
        new HttpError("Network failure", new Error("socket closed")),
        "unknown",
        "telegram_transport_unknown",
      ],
    ] as const) {
      const reports: Array<Record<string, unknown>> = []
      const bot = { api: { sendMessage: async () => Promise.reject(error) } }
      await deliverClaimedApplicationMessage(
        bot as never,
        {
          id: "507f1f77bcf86cd799439088",
          applicationId,
          privateChatId: "42",
          text: "Hello",
        },
        async (report) => {
          reports.push(report)
        }
      )
      assert.equal(reports[0]?.status, expectedStatus)
      assert.equal(reports[0]?.errorCode, expectedCode)
    }
  })

  it("keeps native Reply compatibility when an older API claim has no application id", async () => {
    let options: unknown = "not-called"
    const bot = {
      api: {
        sendMessage: async (
          _chatId: string,
          _text: string,
          value?: unknown
        ) => {
          options = value
          return { message_id: 101 }
        },
      },
    }

    await deliverClaimedApplicationMessage(
      bot as never,
      {
        id: "507f1f77bcf86cd799439088",
        privateChatId: "42",
        text: "DOM — Editor Jane\n\nHello",
      },
      async () => undefined
    )

    assert.equal(options, undefined)
  })

  it("recognizes only replies to structurally official application messages", () => {
    const payload = getApplicationReplyPayload({
      chat: { id: 42, type: "private" },
      from: { id: 42, is_bot: false },
      message: {
        message_id: 102,
        text: "Applicant reply",
        reply_to_message: {
          message_id: 101,
          text: "DOM — Editor Jane\n\nHello",
          from: { id: 1, is_bot: true },
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Ответить",
                  callback_data: applicationReplyCallback(applicationId),
                },
              ],
            ],
          },
        },
      },
    } as never)

    assert.deepEqual(payload, {
      privateChatId: "42",
      telegramUserId: "42",
      telegramMessageId: 102,
      replyToTelegramMessageId: 101,
      text: "Applicant reply",
    })
    assert.deepEqual(
      getApplicationReplyPayload({
        chat: { id: 42, type: "private" },
        from: { id: 42, is_bot: false },
        message: {
          message_id: 102,
          text: "Applicant reply",
          reply_to_message: {
            message_id: 101,
            text: "Обычное сообщение бота",
            from: { id: 1, is_bot: true },
          },
        },
      } as never),
      null
    )
  })

  it("continues normal routing without calling the API for a regular bot-message reply", async () => {
    let authCalls = 0
    let replyCalls = 0
    const middleware = createApplicationMessageReplyMiddleware({
      receiveReply: async () => {
        replyCalls++
        return { accepted: false }
      },
    })
    const { bot, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
      authMiddleware: async (_ctx, next) => {
        authCalls++
        return next()
      },
    })

    await bot.handleUpdate(
      messageUpdate("Applicant reply", {
        message: {
          reply_to_message: {
            message_id: 100,
            text: "DOM — Editor Jane\n\nHello",
            from: { id: 123, is_bot: true, first_name: "DOM Test Bot" },
          },
        },
      })
    )

    assert.equal(authCalls, 1)
    assert.equal(replyCalls, 0)
    assert.equal(telegram.byMethod("sendMessage").length, 1)
    assert.notEqual(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.APPLICATION_THREAD_UNAVAILABLE
    )
  })

  it("parses only bounded application messaging callbacks", () => {
    assert.deepEqual(
      parseApplicationMessageAction(applicationReplyCallback(applicationId)),
      { type: "reply", applicationId }
    )
    assert.deepEqual(parseApplicationMessageAction("appmsg:threads:2"), {
      type: "threads",
      page: 2,
    })
    assert.equal(parseApplicationMessageAction("appmsg:reply:forged"), null)
  })

  it("selects a verified thread and consumes exactly one text reply before authentication", async () => {
    let authCalls = 0
    const received: Array<Record<string, unknown>> = []
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [thread],
        page: 0,
        hasMore: false,
      }),
      receiveReply: async (input) => {
        received.push(input)
        return { accepted: true, stored: true, applicationId }
      },
      now: () => 1_000,
    })
    const { bot, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
      authMiddleware: async (_ctx, next) => {
        authCalls++
        return next()
      },
    })

    await bot.handleUpdate(
      callbackUpdate(applicationReplyCallback(applicationId))
    )
    await bot.handleUpdate(messageUpdate("Applicant answer", { updateId: 2 }))

    assert.equal(authCalls, 0)
    assert.deepEqual(received, [
      {
        privateChatId: "201",
        telegramUserId: "101",
        telegramMessageId: 2,
        applicationId,
        text: "Applicant answer",
      },
    ])
    assert.deepEqual(
      telegram.byMethod("sendMessage").map((call) => call.payload.text),
      [BOT_TEXTS.APPLICATION_REPLY_PROMPT, BOT_TEXTS.APPLICATION_REPLY_RECEIVED]
    )

    await bot.handleUpdate(
      messageUpdate("Unrelated follow-up", { updateId: 3 })
    )
    assert.equal(authCalls, 1)
    assert.equal(received.length, 1)
  })

  it("shows the application message and full attributed history before reply mode", async () => {
    const detailedThread = {
      ...thread,
      applicantDisplayName: "Application Name",
      initialMessage: "Initial request",
      messages: [
        {
          direction: "outbound" as const,
          text: "Hello from DOM",
          senderDisplayName: "Editor Jane",
          createdAt: "2026-10-28T08:30:00.000Z",
        },
        {
          direction: "inbound" as const,
          text: "Applicant answer",
          createdAt: "2026-10-28T09:00:00.000Z",
        },
      ],
    }
    const transcript = formatApplicationThreadTranscript(detailedThread)
    assert.equal(transcript.length, 1)
    assert.ok(
      transcript[0].startsWith("Application Name · сообщение из заявки")
    )
    assert.ok(
      transcript[0].indexOf("Initial request") <
        transcript[0].indexOf("DOM — Editor Jane")
    )
    assert.ok(
      transcript[0].indexOf("DOM — Editor Jane") <
        transcript[0].lastIndexOf("Application Name")
    )

    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [detailedThread],
        page: 0,
        hasMore: false,
      }),
      now: () => 1_000,
    })
    const { bot, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
    })

    await bot.handleUpdate(
      callbackUpdate(applicationReplyCallback(applicationId))
    )

    assert.deepEqual(
      telegram.byMethod("sendMessage").map((call) => call.payload.text),
      [transcript[0], BOT_TEXTS.APPLICATION_REPLY_PROMPT]
    )
  })

  it("keeps a failed selected reply active for a safe retry", async () => {
    let attempts = 0
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [thread],
        page: 0,
        hasMore: false,
      }),
      receiveReply: async () => {
        attempts++
        if (attempts === 1) throw new Error("temporary")
        return { accepted: true, stored: true, applicationId }
      },
      now: () => 1_000,
    })
    const { bot, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
      authMiddleware: async () => {
        assert.fail("selected application replies must stay pre-auth")
      },
    })
    const originalError = console.error
    console.error = () => undefined
    try {
      await bot.handleUpdate(
        callbackUpdate(applicationReplyCallback(applicationId))
      )
      await bot.handleUpdate(messageUpdate("First try", { updateId: 2 }))
      await bot.handleUpdate(messageUpdate("Second try", { updateId: 3 }))
    } finally {
      console.error = originalError
    }

    assert.equal(attempts, 2)
    assert.deepEqual(
      telegram.byMethod("sendMessage").map((call) => call.payload.text),
      [
        BOT_TEXTS.APPLICATION_REPLY_PROMPT,
        BOT_TEXTS.APPLICATION_REPLY_FAILED,
        BOT_TEXTS.APPLICATION_REPLY_RECEIVED,
      ]
    )
  })

  it("expires persisted reply selection without submitting the next message", async () => {
    let clock = 1_000
    let receiveCalls = 0
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [thread],
        page: 0,
        hasMore: false,
      }),
      receiveReply: async () => {
        receiveCalls++
        return { accepted: true, stored: true, applicationId }
      },
      now: () => clock,
    })
    const { bot, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
    })

    await bot.handleUpdate(
      callbackUpdate(applicationReplyCallback(applicationId))
    )
    clock += 15 * 60 * 1_000 + 1
    await bot.handleUpdate(messageUpdate("Too late", { updateId: 2 }))

    assert.equal(receiveCalls, 0)
    assert.equal(
      telegram.byMethod("sendMessage")[1].payload.text,
      BOT_TEXTS.APPLICATION_REPLY_EXPIRED
    )
  })

  it("lets commands continue through routing while clearing reply selection", async () => {
    let receiveCalls = 0
    let authCalls = 0
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [thread],
        page: 0,
        hasMore: false,
      }),
      receiveReply: async () => {
        receiveCalls++
        return { accepted: true, stored: true, applicationId }
      },
      now: () => 1_000,
    })
    const { bot, storage } = await createTestBot({
      applicationReplyMiddleware: middleware,
      authMiddleware: async (_ctx, next) => {
        authCalls++
        return next()
      },
    })

    await bot.handleUpdate(
      callbackUpdate(applicationReplyCallback(applicationId))
    )
    await bot.handleUpdate(messageUpdate("/menu", { updateId: 2 }))

    assert.equal(receiveCalls, 0)
    assert.equal(authCalls, 1)
    assert.equal(
      (await storage.read("101/201"))?.applicationMessaging
        ?.selectedApplicationId,
      undefined
    )
  })

  it("rejects an overlong selected reply and keeps the selection active", async () => {
    let receiveCalls = 0
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [thread],
        page: 0,
        hasMore: false,
      }),
      receiveReply: async () => {
        receiveCalls++
        return { accepted: true, stored: true, applicationId }
      },
      now: () => 1_000,
    })
    const { bot, storage, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
    })

    await bot.handleUpdate(
      callbackUpdate(applicationReplyCallback(applicationId))
    )
    await bot.handleUpdate(messageUpdate("x".repeat(3_501), { updateId: 2 }))

    assert.equal(receiveCalls, 0)
    assert.equal(
      telegram.byMethod("sendMessage").at(-1)?.payload.text,
      BOT_TEXTS.APPLICATION_REPLY_TOO_LONG
    )
    assert.equal(
      (await storage.read("101/201"))?.applicationMessaging
        ?.selectedApplicationId,
      applicationId
    )
  })

  it("lists applicant threads and exposes the menu item only when threads exist", async () => {
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => ({
        enabled: true,
        threads: [thread],
        page: 0,
        hasMore: false,
      }),
    })
    const { bot, telegram } = await createTestBot({
      applicationReplyMiddleware: middleware,
    })

    await bot.handleUpdate(messageUpdate(APPLICATION_THREADS_BUTTON_TEXT))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.APPLICATION_THREADS_TITLE
    )
    const withoutThreads = getMenuForCurrentProfile({
      session: { hasTermsAgreement: true, quizAnswers: {} },
    }).items
    const withThreads = getMenuForCurrentProfile({
      session: {
        hasTermsAgreement: true,
        quizAnswers: {},
        applicationMessaging: { hasThreads: true },
      },
    }).items
    assert.equal(
      withoutThreads?.some(
        (item) => item.key === MENU_ITEM_TYPES.APPLICATION_MESSAGES
      ),
      false
    )
    assert.equal(
      withThreads?.some(
        (item) => item.key === MENU_ITEM_TYPES.APPLICATION_MESSAGES
      ),
      true
    )
  })

  it("refreshes thread availability before opening the authenticated bot menu", async () => {
    let listCalls = 0
    let authCalls = 0
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => {
        listCalls++
        return {
          enabled: true,
          threads: [thread],
          page: 0,
          hasMore: false,
        }
      },
    })
    const { bot, storage } = await createTestBot({
      applicationReplyMiddleware: middleware,
      authMiddleware: async (ctx, next) => {
        authCalls++
        Object.assign(ctx.session, {
          user: makeUser({ roles: [ROLES.USER] }),
          token: "test-token",
        })
        return next()
      },
    })

    await bot.handleUpdate(callbackUpdate(JSON.stringify({ command: "menu" })))

    assert.equal(listCalls, 1)
    assert.equal(authCalls, 1)
    assert.equal(
      (await storage.read("101/201"))?.applicationMessaging?.hasThreads,
      true
    )
  })

  it("refreshes a stale cached false thread availability on menu", async () => {
    let listCalls = 0
    let now = 1_000
    const middleware = createApplicationMessageReplyMiddleware({
      listThreads: async () => {
        listCalls++
        return {
          enabled: true,
          threads: [thread],
          page: 0,
          hasMore: false,
        }
      },
      now: () => now,
    })
    const { bot } = await createTestBot({
      applicationReplyMiddleware: middleware,
      authMiddleware: async (ctx, next) => {
        if (!ctx.session.user) {
          Object.assign(ctx.session, {
            user: makeUser({ roles: [ROLES.USER] }),
            token: "test-token",
            applicationMessaging: {
              hasThreads: false,
              threadAvailabilityCheckedAt: 1_000,
            },
          })
        }
        return next()
      },
    })

    await bot.handleUpdate(messageUpdate("hello"))
    await bot.handleUpdate(
      callbackUpdate(JSON.stringify({ command: "menu" }), { updateId: 2 })
    )
    assert.equal(listCalls, 0)

    now = 61_000
    await bot.handleUpdate(
      callbackUpdate(JSON.stringify({ command: "menu" }), { updateId: 3 })
    )
    assert.equal(listCalls, 1)
  })
})
