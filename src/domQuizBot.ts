import { conversations } from "@grammyjs/conversations"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import dotenv from "dotenv"
import { Bot, Context, GrammyError, HttpError, session } from "grammy"
import path from "path"
import { fileURLToPath } from "url"
import { BOT_COMMANDS } from "./common/enums/botCommands.enum"
import { BOT_COMMANDS_DESCR } from "./common/enums/botCommandsDescr.enum"
import { BOT_ERRORS } from "./common/enums/botErrors.enum"
import { BOT_TEXTS } from "./common/enums/botTexts.enum"
import { BotConversations } from "./conversations"
import { CONVERSATION_NAMES } from "./conversations/enums/conversationNames.enum"

import { MyContext } from "./common/types/myContext"
import { SessionData } from "./common/types/sessionData"
import { ReplyMarkup } from "./common/utils/replyMarkup"
import { DbConnection, getSessions } from "./services/db/connectDB"

import { apiLoginByTelegram } from "./common/middlewares/apiLoginByTelegram"

/** ENVIROMENT */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: __dirname + "/config/.env" })

/** DB CONNECTION */

const connection = await DbConnection.getConnection()
const sessions = getSessions(connection)

/** BOT */

export const domBot = new Bot<MyContext>(process.env.TOKEN || "")
// const privateBot = domBot.chatType("private")

/** COMMANDS */

domBot.api.setMyCommands([
  { command: BOT_COMMANDS.START, description: BOT_COMMANDS_DESCR.START },
  { command: BOT_COMMANDS.MENU, description: BOT_COMMANDS_DESCR.MENU },
])

/** SESSION */

function sessionInit(): SessionData {
  return { hasTermsAgreement: false, quizAnswers: {} }
}

function getSessionKey(ctx: Context): string | undefined {
  // Give every user their one personal session storage per chat with the bot
  // (an independent session for each group and their private chat)
  return ctx.from === undefined || ctx.chat === undefined
    ? undefined
    : `${ctx.from.id}/${ctx.chat.id}`
}

domBot.use(
  session({
    getSessionKey,
    initial: sessionInit,
    storage: new MongoStorage.MongoDBAdapter<SessionData>({
      collection: sessions,
    }),
  })
)

/** API: login */
domBot.use(apiLoginByTelegram)

/** CONVERSATIONS: init */
domBot.use(conversations())

/** COMMAND HANDLERS: start */
domBot.command(BOT_COMMANDS.START, async (ctx) => {
  console.log("BOT_COMMANDS.START")
  await ctx.conversation.exit()
  await ctx.reply(BOT_TEXTS.WELCOME, ReplyMarkup.emptyKeyboard)
})

/** CONVERSATIONS: use */
// domBot.use(...BotConversations.listOfMiddlewares())
domBot.use(
  BotConversations.getMiddlewareByName(CONVERSATION_NAMES.SELECT_MENU_ITEM)
)

/** COMMAND HANDLERS */
domBot.command(BOT_COMMANDS.MENU, async (ctx) => {
  console.log("BOT_COMMANDS.MENU")
  // await ctx.conversation.exit(CONVERSATION_NAMES.SELECT_MENU_ITEM)
  await ctx.conversation.reenter(CONVERSATION_NAMES.SELECT_MENU_ITEM)

  // const middleware = await BotConversations.getMiddlewareByName(
  //   CONVERSATION_NAMES.TERMS_AGREEMENT
  // )

  // console.log("middleware", middleware)

  // if (middleware) {
  //   const composer = domBot.use(middleware)
  //   console.log("composer", composer)

  //   console.log("conversation 2", ctx.conversation)

  //   // await ctx.conversation.enter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
  //   // return await middleware(ctx, async () => {
  //   //   console.log("-------")
  //   //   return
  //   // })
  // }
})

/** MESSAGE HANDLERS */

domBot.on("message", async (ctx) => {
  await ctx.reply(`${BOT_TEXTS.DEFAULT} - ${ctx.message.text}`)
})

/** ERROR HANDLERS */
domBot.catch((err) => {
  const ctx = err.ctx
  console.error(`${BOT_ERRORS.UPDATE} ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) {
    console.error(`${BOT_ERRORS.REQUEST}:`, e.description)
  } else if (e instanceof HttpError) {
    console.error(`${BOT_ERRORS.UNAVAILABLE}:`, e)
  } else {
    console.error(`${BOT_ERRORS.UNKNOWN}:`, e)
  }
})

domBot.errorBoundary((err) => {
  console.error(BOT_ERRORS.CONVERSATION, err)
})
