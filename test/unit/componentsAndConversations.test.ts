import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { numberOfCommissionHours } from "@/common/consts/numberOfCommissionHours"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { ACTION_BUTTON_TEXTS } from "@/common/enums/actionButtonTexts"
import { CURRENCIES } from "@/common/enums/currencies"
import { SocialNetworks } from "@/common/enums/socialNetworks"
import { THERAPY_REQUEST_CATEGORY, THERAPY_REQUEST_CLIENT_GENDER } from "@/common/enums/therapyRequestAnalytics"
import { ROLES } from "@/common/enums/roles"
import { getTextOfRequisites } from "@/common/texts/getTextOfRequisites"
import { getTextOfTherapySession } from "@/common/texts/getTextOfTherapySession"
import getAvailableCommandButtons from "@/common/utils/getAvailableCommandButtons"
import getFilterByCommand from "@/common/utils/getFilterByCommand"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { createForm } from "@/components/Form/form"
import defaultMenu from "@/components/MenuBlock/consts/defaultMenu"
import MenuBlock from "@/components/MenuBlock/menuBlock"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import requisitesShow from "@/conversations/others/requisites"
import termsAgreementShow from "@/conversations/others/termsAgreement"
import therapyRequestAdd from "@/conversations/therapyRequests/add"
import therapySessionAdd from "@/conversations/therapySessions/add"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { CONVERSATION_TERMS_TEXTS } from "@/conversations/enums/conversationTermsTexts"
import { createTestBot } from "../helpers/createTestBot"
import {
  type FakeReply,
  makeContext,
  makeFakeConversation,
} from "../helpers/fakeConversation"
import {
  makeClient,
  makePsychologist,
  makeTherapySession,
  makeUser,
} from "../helpers/fixtures"
import { withMockedApiClient } from "../helpers/apiClientMock"

const broadcastMessageWithUrl = `Здравствуйте! 👋

Хотим напомнить, пожалуйста, отмечайте в боте информацию о проведённых встречах с клиентами.

После каждой сессии нужно зайти в раздел «Мо клиенты» и отметить встречу у соответствующего клиента.

Например:
«Мои клиенты» → «Список клиентов» → Выбрать соответствующего клиента → «Добавить сессию»

Эти данные помогают нам корректно вести статистику работы центра и лучше понимать общую динамику обращений и встреч.

Полная инструкция по внесению информации доступна по ссылке:
https://docs.google.com/presentation/d/1bpbpc5ipIrwF0QZY2E4XWddTmAkz6Cg2Lb4x8UjQK00/edit?usp=drive_link

Спасибо за вашу помощь и внимательность! 💛`

const expectedRequisitesText = [
  "*Beneficiary’s Bank*: JSC TBC Bank",
  "*Beneficiary’s IBAN*: GE54TB7471136010100058",
  "*Name of Beneficiary*: P/E Vladislav Birilov",
].join("\r\n")

const therapySessionFormAnswers = [
  "описание >",
  "Session note",
  "один час",
  CURRENCIES.GEL,
  "100",
]

async function runTherapySessionAdd({
  response,
  answers = therapySessionFormAnswers,
  sessions = [],
  failedReplyText,
}: {
  response: unknown
  answers?: Array<string>
  sessions?: Array<TherapySessionDto>
  failedReplyText?: string
}) {
  // Date inputs require DatePicker's global bot instance.
  await createTestBot()
  const mock = withMockedApiClient(() => {
    if (response instanceof Error) throw response
    return { status: 200, data: response }
  })
  const conversation = makeFakeConversation({ answers })
  const ctx = makeContext({ session: { token: "auth-token" } })
  const typedCtx = ctx as never as {
    replies: Array<FakeReply>
    reply: (text: string, options?: unknown) => Promise<unknown>
  }
  const originalReply = typedCtx.reply.bind(ctx)

  if (failedReplyText) {
    typedCtx.reply = async (text: string, options?: unknown) => {
      if (text === failedReplyText) {
        throw new Error("Telegram unavailable")
      }

      return originalReply(text, options)
    }
  }

  let result: unknown

  try {
    result = await therapySessionAdd.getConversation(makeClient(), sessions)(
      conversation as never,
      ctx
    )
  } finally {
    mock.restore()
  }

  return {
    result,
    calls: mock.calls,
    logs: conversation.logs,
    replies: typedCtx.replies,
  }
}

function assertFailedSessionCreation(
  result: unknown,
  replies: Array<FakeReply>
) {
  assert.equal(result, undefined)
  assert.equal(replies.at(-1)?.text, "*Не удалось добавить сессию*")
  assert.equal(
    replies.some((reply) => reply.text.includes("Beneficiary’s Bank")),
    false
  )
}

describe("utility and component characterization", () => {
  it("escapes Telegram MarkdownV2 content", () => {
    assert.equal(
      ReplyMarkup.escapeForParseModeV2("_*[]()~`>#+-=|{}.!"),
      "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!"
    )
    assert.equal(
      ReplyMarkup.escapeForParseModeV2("0123456789,/:;<"),
      "0123456789,/:;<"
    )
  })

  it("filters available command buttons by terms agreement state", () => {
    const allowed = getAvailableCommandButtons({
      hasTermsAgreement: true,
      quizAnswers: {},
    })
    const blocked = getAvailableCommandButtons({
      hasTermsAgreement: false,
      quizAnswers: {},
    })

    assert.equal(allowed.inline_keyboard.length, 1)
    assert.equal(blocked.inline_keyboard.length, 0)
  })

  it("command filter exits matching conversations and ignores other commands", async () => {
    const exits: Array<unknown> = []
    const ctx = {
      message: { text: `/${BOT_COMMANDS.MENU}` },
      conversation: {
        exit: async (...args: Array<unknown>) => exits.push(args),
      },
    }

    assert.equal(await getFilterByCommand(BOT_COMMANDS.MENU)(ctx as never), true)
    assert.equal(
      await getFilterByCommand(BOT_COMMANDS.REQUISITES)(ctx as never),
      false
    )
    assert.equal(exits.length, 1)
  })

  it("treats urls and slash-containing text as conversation input", async () => {
    const exits: Array<unknown> = []
    const ctx = {
      message: { text: broadcastMessageWithUrl },
      conversation: {
        exit: async (...args: Array<unknown>) => exits.push(args),
      },
    }

    assert.equal(await getFilterByCommand(BOT_COMMANDS.MENU)(ctx as never), true)
    assert.equal(
      await getFilterByCommand(BOT_COMMANDS.REQUISITES)(ctx as never),
      true
    )
    assert.equal(exits.length, 0)
  })

  it("uses only leading Telegram bot commands for command filters", async () => {
    const exits: Array<unknown> = []
    const ctx = {
      message: {
        text: `/${BOT_COMMANDS.MENU}@PsyDom_Tbilisi_Test_bot open`,
        entities: [
          {
            type: "bot_command",
            offset: 0,
            length: `/${BOT_COMMANDS.MENU}@PsyDom_Tbilisi_Test_bot`.length,
          },
        ],
      },
      conversation: {
        exit: async (...args: Array<unknown>) => exits.push(args),
      },
    }

    assert.equal(await getFilterByCommand(BOT_COMMANDS.MENU)(ctx as never), true)
    assert.equal(
      await getFilterByCommand(BOT_COMMANDS.REQUISITES)(ctx as never),
      false
    )
    assert.equal(exits.length, 1)
  })

  it("keeps menu items role-filtered", () => {
    const userMenu = MenuBlock.getMenuFilteredByRoles(defaultMenu, [ROLES.USER])
    const adminMenu = MenuBlock.getMenuFilteredByRoles(defaultMenu, [ROLES.ADMIN])

    assert.equal(
      userMenu.items?.some((item) => item.key === MENU_ITEM_TYPES.USERS),
      false
    )
    assert.equal(
      adminMenu.items?.some((item) => item.key === MENU_ITEM_TYPES.USERS),
      true
    )
  })

  it("prepares menu items with fresh keys and parent links", () => {
    const menu = MenuBlock.getPreparedMenu({
      name: "Root",
      items: [{ name: "Child" }],
    })

    assert.ok(menu.key)
    assert.ok(menu.items?.[0].key)
    assert.equal(menu.items?.[0].parent?.name, "Root")
  })

  it("collects form values, retries invalid values, and converts selects", async () => {
    const conversation = makeFakeConversation({
      answers: ["Alice", "bad-number", "42", "One"],
    })
    const ctx = makeContext()
    const form = createForm(conversation as never, ctx, [
      { name: "name", type: FORM_INPUT_TYPES.STRING },
      { name: "age", type: FORM_INPUT_TYPES.NUMBER },
      {
        name: "choice",
        type: FORM_INPUT_TYPES.SELECT,
        values: [{ text: "One", value: 1 }],
      },
    ] as const)

    const result = await form.requestData()

    assert.equal(result.status, FORM_RESULT_STATUSES.FINISHED)
    assert.deepEqual(result.data, { name: "Alice", age: 42, choice: 1 })
    assert.equal(
      conversation.replies.some(
        (reply) => reply.text === "Должно быть целое число"
      ),
      true
    )
  })

  it("returns rejected form status when user cancels", async () => {
    const conversation = makeFakeConversation({ answers: [ACTION_BUTTON_TEXTS.REJECT] })
    const ctx = makeContext()
    const form = createForm(conversation as never, ctx, [
      { name: "name", type: FORM_INPUT_TYPES.STRING },
    ] as const)

    const result = await form.requestData()

    assert.equal(result.status, FORM_RESULT_STATUSES.REJECTED)
  })
})

describe("conversation characterization", () => {
  let originalApiUrl: string | undefined

  beforeEach(() => {
    originalApiUrl = process.env.API_URL
    process.env.API_URL = "http://dom-api.test"
  })

  afterEach(() => {
    process.env.API_URL = originalApiUrl
  })

  it("terms agreement records accepted state and shows available commands", async () => {
    const conversation = makeFakeConversation({
      answers: [CONVERSATION_TERMS_TEXTS.YES],
    })
    conversation.session.hasTermsAgreement = false
    const ctx = makeContext({
      session: { hasTermsAgreement: false },
    })

    const result = await termsAgreementShow.getConversation()(
      conversation as never,
      ctx
    )

    assert.equal(result, true)
    assert.equal(conversation.session.hasTermsAgreement, true)
    assert.equal(
      conversation.replies.some(
        (reply) => reply.text === CONVERSATION_TERMS_TEXTS.YES_REPLY
      ),
      true
    )
  })

  it("keeps the standalone requisites output and keyboard removal unchanged", async () => {
    const ctx = makeContext()

    await requisitesShow.getConversation()(makeFakeConversation() as never, ctx)

    assert.equal(getTextOfRequisites(), expectedRequisitesText)
    assert.deepEqual(
      (ctx as never as { replies: Array<FakeReply> }).replies,
      [
        {
          text: expectedRequisitesText,
          options: {
            ...ReplyMarkup.emptyKeyboard,
            ...ReplyMarkup.parseModeV2,
          },
        },
      ]
    )
  })

  it("sends requisites once after a created therapy session", async () => {
    const addedSession = makeTherapySession({ descr: "Session note" })
    const commissionRequisites = getTextOfRequisites(
      "Комиссия 50 GEL — реквизиты для оплаты"
    )
    const { result, replies } = await runTherapySessionAdd({
      response: addedSession,
    })
    const finalReplies = replies.slice(-3)

    assert.deepEqual(
      finalReplies.map((reply) => reply.text),
      [
        "*Добавлена сессия*",
        getTextOfTherapySession(addedSession),
        commissionRequisites,
      ]
    )
    assert.deepEqual(
      finalReplies.map((reply) => reply.options),
      [
        ReplyMarkup.parseModeV2,
        ReplyMarkup.parseModeV2,
        ReplyMarkup.parseModeV2,
      ]
    )
    assert.equal(
      replies.filter((reply) => reply.text === commissionRequisites).length,
      1
    )
    assert.deepEqual(result, { stepsBack: 2 })
  })

  it("does not send requisites when the created session has zero commission", async () => {
    const addedSession = makeTherapySession({
      descr: "Session note",
      commission: { currency: CURRENCIES.GEL, value: 0 },
    })
    const sessions = [
      makeTherapySession({ duration: numberOfCommissionHours * 60 }),
    ]
    const { calls, result, replies } = await runTherapySessionAdd({
      response: addedSession,
      sessions,
    })
    const createCall = calls.find(
      (call) => call.url === "http://dom-api.test/therapy-sessions/me"
    )

    assert.ok(createCall)
    assert.deepEqual(
      (createCall.data as { commission: { value: number } }).commission.value,
      0
    )
    assert.deepEqual(
      replies.slice(-2).map((reply) => reply.text),
      ["*Добавлена сессия*", getTextOfTherapySession(addedSession)]
    )
    assert.equal(
      replies.some((reply) => reply.text.includes("Beneficiary’s Bank")),
      false
    )
    assert.deepEqual(result, { stepsBack: 2 })
  })

  it("keeps navigation when the requisites reply fails after creation", async () => {
    const addedSession = makeTherapySession({ descr: "Session note" })
    const commissionRequisites = getTextOfRequisites(
      "Комиссия 50 GEL — реквизиты для оплаты"
    )
    const { logs, result, replies } = await runTherapySessionAdd({
      response: addedSession,
      failedReplyText: commissionRequisites,
    })

    assert.deepEqual(
      replies.slice(-2).map((reply) => reply.text),
      ["*Добавлена сессия*", getTextOfTherapySession(addedSession)]
    )
    assert.equal(
      logs.some(
        (entry) => Array.isArray(entry) && entry[0] === BOT_ERRORS.REQUEST
      ),
      true
    )
    assert.deepEqual(result, { stepsBack: 2 })
  })

  it("does not create a session or send requisites when the form is cancelled", async () => {
    const { calls, result, replies } = await runTherapySessionAdd({
      response: new Error("Unexpected API request"),
      answers: [ACTION_BUTTON_TEXTS.REJECT],
    })

    assert.equal(calls.length, 0)
    assert.equal(result, undefined)
    assert.equal(
      replies.some((reply) =>
        [
          "*Добавлена сессия*",
          "*Не удалось добавить сессию*",
        ].includes(reply.text)
      ) || replies.some((reply) => reply.text.includes("Beneficiary’s Bank")),
      false
    )
  })

  it("keeps API failures free of session details and requisites", async () => {
    const { result, replies } = await runTherapySessionAdd({
      response: new Error("API unavailable"),
    })

    assertFailedSessionCreation(result, replies)
  })

  it("treats an empty create response as failure without requisites", async () => {
    const { result, replies } = await runTherapySessionAdd({
      response: undefined,
    })

    assertFailedSessionCreation(result, replies)
  })

  it("therapy request create flow builds the current dom-api payload", async () => {
    const psychologist = makePsychologist({
      _id: "psychologist-2",
      user: makeUser({
        _id: "psy-user-2",
        name: "Psy Two",
        roles: [ROLES.PSYCHOLOGIST],
      }),
    })
    const mock = withMockedApiClient((config) => {
      if (config.method === "get" && config.url === "http://dom-api.test/psychologists") {
        return { status: 200, data: [psychologist] }
      }

      return {
        status: 200,
        data: { _id: "therapy-request-created" },
      }
    })
    const conversation = makeFakeConversation({
      answers: [
        "Client Name",
        "Client request text",
        "Женщина",
        "Индивидуальная терапия",
        "Psy Two",
        "@client_override",
      ],
    })
    const ctx = makeContext({
      session: {
        user: makeUser({ _id: "request-user-1" }),
        token: "auth-token",
      },
    })

    try {
      await therapyRequestAdd.getConversation()(conversation as never, ctx)
    } finally {
      mock.restore()
    }

    const createCall = mock.calls.find(
      (call) => call.url === "http://dom-api.test/therapy-requests"
    )

    assert.ok(createCall)
    assert.deepEqual(createCall.data, {
      name: "Client Name",
      descr: "Client request text",
      user: "request-user-1",
      psychologist: "psychologist-2",
      clientGender: THERAPY_REQUEST_CLIENT_GENDER.FEMALE,
      requestCategory: THERAPY_REQUEST_CATEGORY.INDIVIDUAL,
      contacts: [
        {
          network: SocialNetworks.Telegram,
          username: "client_override",
        },
      ],
    })
    assert.equal(
      (ctx as never as { replies: Array<{ text: string }> }).replies.some(
        (reply) => reply.text === "*Ваш запрос отправлен*"
      ),
      true
    )
  })
})
