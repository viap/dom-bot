import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import { createDomBot } from "@/createDomBot"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { ROLES } from "@/common/enums/roles"
import { makePsychologist, makeUser } from "../helpers/fixtures"
import { installTelegramApiRecorder, messageUpdate } from "../helpers/telegram"
import { BotConfig, MiddlewareFn } from "grammy"
import { MyContext } from "@/common/types/myContext"
import { SessionData } from "@/common/types/sessionData"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { createMongoIntegrationConnection, getMongoIntegrationConfig } from "../helpers/mongo"

const mongoConfig = getMongoIntegrationConfig()

describe("Mongo session storage integration", { skip: !mongoConfig }, () => {
  let connection: Awaited<ReturnType<typeof createMongoIntegrationConnection>>

  before(async () => {
    connection = await createMongoIntegrationConnection()
  })

  after(async () => {
    if (connection) {
      await connection.db.collection("sessions").deleteMany({})
      await connection.close()
    }
  })

  it("creates, reads, updates, and deletes sessions", async () => {
    assert.ok(connection)
    const collection = connection.db.collection<MongoStorage.ISession>("sessions")
    const adapter = new MongoStorage.MongoDBAdapter<SessionData>({ collection })

    await adapter.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: "first-token",
    })
    assert.equal((await adapter.read("101/201"))?.token, "first-token")

    await adapter.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: "updated-token",
    })
    assert.equal((await adapter.read("101/201"))?.token, "updated-token")

    await adapter.delete("101/201")
    assert.equal(await adapter.read("101/201"), undefined)
  })

  it("persists sessions across adapter instances and isolates users/chats", async () => {
    assert.ok(connection)
    const collection = connection.db.collection<MongoStorage.ISession>("sessions")
    const firstAdapter = new MongoStorage.MongoDBAdapter<SessionData>({
      collection,
    })
    const secondAdapter = new MongoStorage.MongoDBAdapter<SessionData>({
      collection,
    })

    await firstAdapter.write("101/201", {
      hasTermsAgreement: true,
      quizAnswers: {},
      token: "private-token",
    })
    await firstAdapter.write("101/301", {
      hasTermsAgreement: false,
      quizAnswers: {},
      token: "group-token",
    })

    assert.equal((await secondAdapter.read("101/201"))?.token, "private-token")
    assert.equal((await secondAdapter.read("101/301"))?.token, "group-token")
  })

  it("characterizes malformed stored data as adapter passthrough", async () => {
    assert.ok(connection)
    const collection = connection.db.collection<MongoStorage.ISession>("sessions")
    const adapter = new MongoStorage.MongoDBAdapter<SessionData>({ collection })

    await collection.insertOne({
      key: "malformed",
      value: { stale: true },
    } as never)

    assert.deepEqual(await adapter.read("malformed"), { stale: true })
  })

  it("keeps cleared optional fields absent across adapter recreation", async () => {
    assert.ok(connection)
    const collection = connection.db.collection<MongoStorage.ISession>("sessions")
    const firstAdapter = new MongoStorage.MongoDBAdapter<SessionData>({
      collection,
    })
    const user = makeUser({ roles: [ROLES.USER, ROLES.PSYCHOLOGIST] })
    const session: SessionData = {
      hasTermsAgreement: true,
      quizAnswers: {},
      psychologist: makePsychologist({ user }),
      menuDeepLink: { goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW },
    }

    await firstAdapter.write("cleared-fields", session)
    delete session.psychologist
    delete session.menuDeepLink
    await firstAdapter.write("cleared-fields", session)

    const secondAdapter = new MongoStorage.MongoDBAdapter<SessionData>({
      collection,
    })
    const stored = await secondAdapter.read("cleared-fields")
    assert.equal(Object.hasOwn(stored || {}, "psychologist"), false)
    assert.equal(Object.hasOwn(stored || {}, "menuDeepLink"), false)
    assert.equal(Object.hasOwn(stored || {}, "syncedCommandsKey"), false)
  })

  it("recovers incompatible conversation history across Mongo adapter instances", async () => {
    assert.ok(connection)
    const collection = connection.db.collection<MongoStorage.ISession>("sessions")
    await collection.deleteMany({})
    const authMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
      const user = makeUser({ roles: [ROLES.USER] })
      Object.assign(ctx.session, { token: "test-token", user })
      await next()
    }
    const botConfig: BotConfig<MyContext> = {
      botInfo: {
        id: 123,
        is_bot: true,
        first_name: "DOM Test Bot",
        username: "dom_test_bot",
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
      },
    }
    const firstAdapter = new MongoStorage.MongoDBAdapter<SessionData>({
      collection,
    })
    const first = createDomBot({
      token: "123:test-token",
      botConfig,
      sessionStorage: firstAdapter,
      authMiddleware,
      conversationVersion: 1,
    })
    installTelegramApiRecorder(first)
    await first.handleUpdate(messageUpdate("/menu"))

    const beforeRecovery = await firstAdapter.read("101/201")
    assert.ok(beforeRecovery)
    Object.assign(beforeRecovery, {
      menuDeepLink: { goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW },
    })
    await firstAdapter.write("101/201", beforeRecovery)

    const secondAdapter = new MongoStorage.MongoDBAdapter<SessionData>({
      collection,
    })
    const second = createDomBot({
      token: "123:test-token",
      botConfig,
      sessionStorage: secondAdapter,
      authMiddleware,
      conversationVersion: 2,
    })
    const telegram = installTelegramApiRecorder(second)
    await second.handleUpdate(messageUpdate("stale answer", { updateId: 2 }))

    assert.equal(
      telegram.byMethod("sendMessage")[0].payload.text,
      BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED
    )
    const saved = await secondAdapter.read("101/201")
    assert.equal(saved?.interactionState?.conversationVersion, 2)
    assert.equal(saved?.interactionState?.pendingRecovery, undefined)
    assert.equal(Object.hasOwn(saved || {}, "menuDeepLink"), false)
    assert.equal(
      Object.hasOwn(saved?.interactionState || {}, "pendingRecovery"),
      false
    )
  })
})
