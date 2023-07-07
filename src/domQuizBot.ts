import {
  conversations,
  createConversation,
  type ConversationFlavor,
  Conversation,
} from "@grammyjs/conversations"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import dotenv from "dotenv"
import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  SessionFlavor,
  session,
} from "grammy"
import path from "path"
import { fileURLToPath } from "url"
import {
  BOT_COMMANDS,
  BOT_COMMANDS_DESCR,
  BOT_ERROR,
  BOT_MSG,
} from "./config/consts"
import { CONVERSATION_NAME } from "./conversations/consts"
import ConversationsList from "./conversations"

import { DbConnection, getSessions } from "./services/db/connectDB"
import { SessionData } from "./types"
import { ReplyMarkup } from "./config/consts"

import { MENU_LISTS, MenuModel } from "./models/Menu"
import { MenuBlock } from "./components/MenuBlock"

/** ENVIROMENT */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: __dirname + "/config/.env" })

/** DB CONNECTION */

const connection = await DbConnection.getConnection()
const sessions = getSessions(connection)

const telegramMenu = await MenuModel.findOne({
  key: MENU_LISTS.TELERGAM,
})
const menuBlock = new MenuBlock(telegramMenu!)

/** BOT */

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor
// type MyConversation = Conversation<MyContext>

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

/** CONVERSATIONS: init */
domBot.use(conversations())

/** COMMAND HANDLERS: start */
domBot.command(BOT_COMMANDS.START, async (ctx) => {
  console.log("BOT_COMMANDS.START")
  await ctx.conversation.exit()
  await ctx.reply(BOT_MSG.WELCOME, { reply_markup: ReplyMarkup.emptyKeyboard })
})

/** CONVERSATIONS: use */

Object.values(CONVERSATION_NAME).forEach((conversationName) => {
  if (conversationName in ConversationsList) {
    switch (conversationName) {
      case CONVERSATION_NAME.SELECT_MENU_ITEM:
        if (menuBlock) {
          domBot.use(
            createConversation(
              new ConversationsList[conversationName]<MyContext>(
                menuBlock
              ).getConversation(),
              conversationName
            )
          )
        }
        break
      default:
        domBot.use(
          createConversation(
            new ConversationsList[
              conversationName
            ]<MyContext>().getConversation(),
            conversationName
          )
        )
    }
  }
})

/** COMMAND HANDLERS */

domBot.command(BOT_COMMANDS.MENU, async (ctx) => {
  console.log("BOT_COMMANDS.MENU")
  await ctx.conversation.enter(CONVERSATION_NAME.SELECT_MENU_ITEM)
})

/** MESSAGE HANDLERS */

domBot.on("message", (ctx) => {
  ctx.reply(`${BOT_MSG.DEFAULT} - ${ctx.message.text}`)
})

/** ERROR HANDLERS */
domBot.catch((err) => {
  const ctx = err.ctx
  console.error(`${BOT_ERROR.UPDATE} ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) {
    console.error(`${BOT_ERROR.REQUEST}:`, e.description)
  } else if (e instanceof HttpError) {
    console.error(`${BOT_ERROR.UNAVAILABLE}:`, e)
  } else {
    console.error(`${BOT_ERROR.UNKNOWN}:`, e)
  }
})

domBot.errorBoundary((err) => {
  console.error(BOT_ERROR.CONVERSATION, err)
})
