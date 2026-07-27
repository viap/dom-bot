import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { ACTION_BUTTON_TEXTS } from "@/common/enums/actionButtonTexts"
import { SocialNetworks } from "@/common/enums/socialNetworks"
import { THERAPY_REQUEST_CATEGORY, THERAPY_REQUEST_CLIENT_GENDER } from "@/common/enums/therapyRequestAnalytics"
import { ROLES } from "@/common/enums/roles"
import getAvailableCommandButtons from "@/common/utils/getAvailableCommandButtons"
import getFilterByCommand from "@/common/utils/getFilterByCommand"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { createForm } from "@/components/Form/form"
import defaultMenu from "@/components/MenuBlock/consts/defaultMenu"
import MenuBlock from "@/components/MenuBlock/menuBlock"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import termsAgreementShow from "@/conversations/others/termsAgreement"
import therapyRequestAdd from "@/conversations/therapyRequests/add"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { CONVERSATION_TERMS_TEXTS } from "@/conversations/enums/conversationTermsTexts"
import { makeContext, makeFakeConversation } from "../helpers/fakeConversation"
import { makePsychologist, makeUser } from "../helpers/fixtures"
import { withMockedApiClient } from "../helpers/apiClientMock"

describe("utility and component characterization", () => {
  it("escapes Telegram MarkdownV2 content", () => {
    assert.equal(
      ReplyMarkup.escapeForParseModeV2("_*[]()~`>#+-=|{}.!"),
      "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!"
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
