import * as MongoStorage from "@grammyjs/storage-mongodb"
import { config } from "dotenv"
import { cwd } from "process"
import { createDomBot } from "@/createDomBot"
import { SessionData } from "@/common/types/sessionData"
import { DbConnection, getSessions } from "@/services/db/connectDB"
import {
  setDefaultBotCommands,
  startNotificationListener,
} from "@/startup"

/** ENVIROMENT */
config({ path: cwd() + "/config/.env" })

/** DB CONNECTION */
const connection = await DbConnection.getConnection()
const sessions = getSessions(connection)

/** BOT */
const domBot = createDomBot({
  sessionStorage: new MongoStorage.MongoDBAdapter<SessionData>({
    collection: sessions,
  }),
})

await setDefaultBotCommands(domBot)
await startNotificationListener(domBot, sessions)

export default domBot
