import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import { SessionData } from "@/common/types/sessionData"
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
})
