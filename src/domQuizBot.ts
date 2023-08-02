import { conversations, createConversation } from "@grammyjs/conversations"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import dotenv from "dotenv"
import { Bot, Context, GrammyError, HttpError, session } from "grammy"
import path from "path"
import { fileURLToPath } from "url"
import { BOT_COMMANDS } from "./common/enums/botCommands.enum"
import { BOT_COMMANDS_DESCR } from "./common/enums/botCommandsDescr.enum"
import { BOT_ERRORS } from "./common/enums/botErrors.enum"
import { BOT_TEXTS } from "./common/enums/botTexts.enum"
import ConversationsList from "./conversations"
import { CONVERSATION_NAMES } from "./conversations/enums/conversationNames.enum"

import { ReplyMarkup } from "./common/consts/replyMarkup"
import { DbConnection, getSessions } from "./services/db/connectDB"
import { MyContext } from "./types/myContext"
import { SessionData } from "./types/sessionData"

import { MenuBlock } from "./components/MenuBlock/menuBlock"
import { DefaultMenu } from "./components/MenuBlock/consts/defaultMenu"

import { getMeUser } from "./api/getMeUser"
import { isValidToken } from "./api/isValidToken"
import { loginByTelegram } from "./api/loginByTelegram"
import { TelegramUserDto } from "./common/dto/telegramUser.dto"

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
domBot.use(async (ctx, next) => {
  if (ctx.from) {
    if (!(await isValidToken(ctx))) {
      delete ctx.session.token
    }

    if (!ctx.session.token) {
      await loginByTelegram(ctx, {
        ...ctx.from,
        id: ctx.from.id + "",
      } as TelegramUserDto)
    }
  }

  if (!ctx.session.token) {
    return await ctx.reply(BOT_TEXTS.UNAVAILABLE)
  }

  return next()
})

/** CONVERSATIONS: init */
domBot.use(conversations())

/** COMMAND HANDLERS: start */
domBot.command(BOT_COMMANDS.START, async (ctx) => {
  console.log("BOT_COMMANDS.START")
  await ctx.conversation.exit()
  await ctx.reply(BOT_TEXTS.WELCOME, {
    reply_markup: ReplyMarkup.emptyKeyboard,
  })
})

/** CONVERSATIONS: use */

Object.values(CONVERSATION_NAMES).forEach((conversationName) => {
  if (conversationName in ConversationsList) {
    switch (conversationName) {
      case CONVERSATION_NAMES.SELECT_MENU_ITEM:
        domBot.use(async (ctx, next) => {
          const user = await getMeUser(ctx)
          if (!user) {
            return await ctx.reply("Пользователь не авторизован")
          }

          const menuBlock = DefaultMenu
            ? new MenuBlock(user, DefaultMenu)
            : undefined

          const selectMenuItemConversation = createConversation(
            new ConversationsList[conversationName]<MyContext>(
              menuBlock
            ).getConversation(),
            conversationName
          )

          return selectMenuItemConversation(ctx, next)
        })
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
  await ctx.conversation.enter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
})

/** MESSAGE HANDLERS */

domBot.on("message", (ctx) => {
  ctx.reply(`${BOT_TEXTS.DEFAULT} - ${ctx.message.text}`)
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
