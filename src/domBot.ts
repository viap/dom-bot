import { conversations } from "@grammyjs/conversations"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import dotenv from "dotenv"
import { Bot, Context, GrammyError, HttpError, session } from "grammy"
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

import { cwd } from "process"
import { apiLoginByTelegram } from "./common/middlewares/apiLoginByTelegram"
import getAvailableCommandsMessage from "./common/utils/getAvailableCommandsMessage"
import getFilterByCommand from "./common/utils/getFilterByCommand"
import NotificationListener from "./components/NotificationListener/notificationListener"

/** ENVIROMENT */
dotenv.config({ path: cwd() + "/config/.env" })

/** DB CONNECTION */

const connection = await DbConnection.getConnection()
const sessions = getSessions(connection)

/** BOT */

const domBot = new Bot<MyContext>(process.env.TOKEN || "")
export default domBot
// const privateBot = domBot.chatType("private")

/** COMMANDS */

domBot.api.setMyCommands([
  { command: BOT_COMMANDS.START, description: BOT_COMMANDS_DESCR.START },
  { command: BOT_COMMANDS.MENU, description: BOT_COMMANDS_DESCR.MENU },
  {
    command: BOT_COMMANDS.TERMS_AGREEMENT,
    description: BOT_COMMANDS_DESCR.TERMS_AGREEMENT,
  },
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

// NOTICE: connection to the api websocket for listening events and show notifications
domBot.fork(async (ctx: MyContext, next) => {
  NotificationListener.start(ctx)
  return next()
})

/** COMMAND HANDLERS: start */
domBot.command(BOT_COMMANDS.START, async (ctx) => {
  await ctx.conversation.exit()

  await ctx.reply(BOT_TEXTS.WELCOME, ReplyMarkup.emptyKeyboard)

  await ctx.reply(
    getAvailableCommandsMessage(ctx.session),
    ReplyMarkup.emptyKeyboard
  )
})

/** CONVERSATIONS: use */
domBot
  .filter(getFilterByCommand(BOT_COMMANDS.TERMS_AGREEMENT))
  .use(BotConversations.getMiddlewareByName(CONVERSATION_NAMES.TERMS_AGREEMENT))

domBot
  .filter(getFilterByCommand(BOT_COMMANDS.MENU))
  .use(
    BotConversations.getMiddlewareByName(CONVERSATION_NAMES.SELECT_MENU_ITEM)
  )

/** COMMAND HANDLERS */
domBot.command(BOT_COMMANDS.TERMS_AGREEMENT, async (ctx) => {
  console.log("HANDLE COMMAND:", BOT_COMMANDS.TERMS_AGREEMENT)
  await ctx.conversation.reenter(CONVERSATION_NAMES.TERMS_AGREEMENT)
})

domBot.command(BOT_COMMANDS.MENU, async (ctx) => {
  console.log("HANDLE COMMAND:", BOT_COMMANDS.MENU)
  await ctx.conversation.reenter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
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
