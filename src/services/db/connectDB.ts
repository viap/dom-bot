import * as MongoStorage from "@grammyjs/storage-mongodb"
import mongoose from "mongoose"
import { DB_MESSAGES } from "./consts"

export class DbConnection {
  private static connection: mongoose.Connection

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private static initHandlers() {
    if (DbConnection.connection) {
      DbConnection.connection.on(
        "error",
        console.error.bind(console, DB_MESSAGES.CONNECTION_ERROR)
      )

      DbConnection.connection.once("open", function () {
        console.info(DB_MESSAGES.CONNECTION_SUCCESS)
      })
    }
  }

  public static async getConnection() {
    if (!DbConnection.connection) {
      const connectionPromise = mongoose.connect(
        process.env.MONGO_DB_URL || "",
        {
          dbName: process.env.MONGO_DB_NAME || "",
          user: process.env.MONGO_DB_USER || "",
          pass: process.env.MONGO_DB_PASSWORD || "",
        }
      )
      DbConnection.connection = mongoose.connection
      DbConnection.initHandlers()

      await connectionPromise
    }

    return DbConnection.connection
  }
}

export const getSessions = (connection: mongoose.Connection) => {
  return connection.db.collection<MongoStorage.ISession>("sessions")
}
