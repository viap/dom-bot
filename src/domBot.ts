import { ConversationHandle, conversations } from "@grammyjs/conversations"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import dotenv from "dotenv"
import { Bot, Context, GrammyError, HttpError, session } from "grammy"
import { BOT_COMMANDS } from "./common/enums/botCommands"
import { BOT_COMMANDS_DESCR } from "./common/enums/botCommandsDescr"
import { BOT_ERRORS } from "./common/enums/botErrors"
import { BOT_TEXTS } from "./common/enums/botTexts"
import { BotConversations } from "./conversations"
import { CONVERSATION_NAMES } from "./conversations/enums/conversationNames"

import { MyContext } from "./common/types/myContext"
import { SessionData, defaultSessionData } from "./common/types/sessionData"
import { DbConnection, getSessions } from "./services/db/connectDB"

import { cwd } from "process"
import { apiLoginByTelegram } from "./common/middlewares/apiLoginByTelegram"
import { PrimitiveValues } from "./common/types/primitiveValues"
import getAvailableCommandButtons from "./common/utils/getAvailableCommandButtons"
import getFilterByCommand from "./common/utils/getFilterByCommand"
import { MENU_ITEM_TYPES } from "./components/MenuBlock/enums/menuItemTypes"
import MenuBlock from "./components/MenuBlock/menuBlock"
import NotificationListener from "./components/NotificationListener/notificationListener"

/** ENVIROMENT */
dotenv.config({ path: cwd() + "/config/.env" })

/** DB CONNECTION */

const connection = await DbConnection.getConnection()
const sessions = getSessions(connection)

/** BOT */

const domBot = new Bot<MyContext>(process.env.TOKEN || "")

// NOTICE: connection to the api websocket for listening events and show notifications
NotificationListener.start(domBot, sessions)

export default domBot
// const privateBot = domBot.chatType("private")

/** COMMANDS */

domBot.api.setMyCommands([
  { command: BOT_COMMANDS.START, description: BOT_COMMANDS_DESCR.START },
  { command: BOT_COMMANDS.MENU, description: BOT_COMMANDS_DESCR.MENU },
  // {
  //   command: BOT_COMMANDS.TERMS_AGREEMENT,
  //   description: BOT_COMMANDS_DESCR.TERMS_AGREEMENT,
  // },
])

/** SESSION */

function sessionInit(): SessionData {
  // NOTICE: should create a new object otherwise several chats might share the same session object in memory
  // https://grammy.dev/plugins/session#initial-session-data
  return { ...defaultSessionData }
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
  try {
    await ctx.conversation.exit()
  } catch (error) {
    console.log(BOT_ERRORS.CONVERSATION_EXIT, error)
  }

  await ctx.reply(BOT_TEXTS.WELCOME, {
    reply_markup: getAvailableCommandButtons(ctx.session),
  })
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

/* CALLBACKS */
domBot.on("callback_query:data", async (ctx: MyContext) => {
  let data:
    | { [key: string]: PrimitiveValues | Array<PrimitiveValues> }
    | undefined
  try {
    data = JSON.parse(ctx.callbackQuery?.data || "")
  } catch (e) {
    data = undefined
  }

  if (!data) {
    return
  }

  if (data.command) {
    switch (data.command) {
      case BOT_COMMANDS.MENU:
        await ctx.conversation.reenter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
        break
      case BOT_COMMANDS.TERMS_AGREEMENT:
        await ctx.conversation.reenter(CONVERSATION_NAMES.TERMS_AGREEMENT)
        break
    }
  } else if (data.goTo) {
    switch (data.goTo) {
      case MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW:
        MenuBlock.setDeepLink(data.goTo)
        await ctx.conversation.reenter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
        break
    }
  } else {
    console.log(BOT_ERRORS.UNKNOWN_CALLBACK, ctx.callbackQuery?.data)
  }

  // NOTICE: remove loading animation
  await ctx.answerCallbackQuery()
})

/** COMMAND HANDLERS */
domBot.command(BOT_COMMANDS.TERMS_AGREEMENT, async (ctx) => {
  await ctx.conversation.reenter(CONVERSATION_NAMES.TERMS_AGREEMENT)
})

domBot.command(BOT_COMMANDS.MENU, async (ctx) => {
  await ctx.conversation.enter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
})

/** MESSAGE HANDLERS */

domBot.on("message", async (ctx) => {
  await ctx.reply(`${BOT_TEXTS.DEFAULT} - ${ctx.message.text}`, {
    reply_markup: getAvailableCommandButtons(ctx.session),
  })
  // await ctx.reply(BOT_TEXTS.SHOW_COMMAND, {
  //   reply_markup: getAvailableCommandButtons(ctx.session),
  // })
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
