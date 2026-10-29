import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { deliverClaimedApplicationMessage } from "@/components/ApplicationMessageListener/applicationMessageListener"
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

  it("recognizes only private replies to official application messages", () => {
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
    assert.equal(
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

  it("does not fall through to DOM User authentication for an unavailable native reply", async () => {
    let authCalls = 0
    const middleware = createApplicationMessageReplyMiddleware({
      receiveReply: async () => ({ accepted: false }),
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

    assert.equal(authCalls, 0)
    assert.equal(
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
})
