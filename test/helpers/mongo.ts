import mongoose from "mongoose"

export function getMongoIntegrationConfig():
  | { url: string; dbName: string }
  | undefined {
  const url = process.env.DOM_BOT_TEST_MONGO_URL
  const dbName = process.env.DOM_BOT_TEST_MONGO_DB_NAME

  if (!url || !dbName) {
    return undefined
  }

  if (!/test/i.test(dbName)) {
    throw new Error(
      "DOM_BOT_TEST_MONGO_DB_NAME must clearly be a test database"
    )
  }

  return { url, dbName }
}

export async function createMongoIntegrationConnection() {
  const config = getMongoIntegrationConfig()
  if (!config) return undefined

  const connection = await mongoose.createConnection(config.url, {
    dbName: config.dbName,
    serverSelectionTimeoutMS: 5000,
  }).asPromise()

  await connection.db.collection("sessions").deleteMany({})

  return connection
}
