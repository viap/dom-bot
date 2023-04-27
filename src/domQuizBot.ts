import {
  conversations,
  createConversation,
  type ConversationFlavor,
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
  CONVERSATION_NAME,
} from "./config/consts"
import { QuizProgress } from "./conversations/quizProgress"
import { Terms } from "./conversations/terms"
import { DbConnection, getSessions } from "./services/db/connectDB"
import { SessionData } from "./types"

/** ENVIROMENT */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: __dirname + "/config/.env" })

/** DB CONNECTION */

const connection = await DbConnection.getConnection()
const sessions = getSessions(connection)

/** BOT */

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor
// type MyConversation = Conversation<MyContext>

export const domBot = new Bot<MyContext>(process.env.TOKEN || "")
// const privateBot = domBot.chatType("private")

/** COMMANDS */

domBot.api.setMyCommands([
  { command: BOT_COMMANDS.START, description: BOT_COMMANDS_DESCR.START },
  {
    command: BOT_COMMANDS.START_QUIZ,
    description: BOT_COMMANDS_DESCR.START_QUIZ,
  },
  { command: BOT_COMMANDS.TERMS, description: BOT_COMMANDS_DESCR.TERMS },
  // {
  //   command: BOT_COMMANDS.SELECT_QUIZ,
  //   description: BOT_COMMANDS_DESCR.SELECT_QUIZ,
  // },
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

/** MIDDLEWARES: init */

domBot.use(conversations())

domBot.command(BOT_COMMANDS.START, async (ctx) => {
  await ctx.conversation.exit()
  await ctx.reply(BOT_MSG.WELCOME)
})

/** CONVERSATIONS: use */

// const quizProgress = new QuizProgress<MyContext>(firstQuiz)
const terms = new Terms<MyContext>()
const quizProgress = new QuizProgress<MyContext>()

domBot.use(
  createConversation(terms.getConversation(), CONVERSATION_NAME.TERMS_AGREEMENT)
)
domBot.use(
  createConversation(
    quizProgress.getConversation(),
    CONVERSATION_NAME.QUIZ_PROGRESS
  )
)

/** COMMAND HANDLERS */

domBot.command(BOT_COMMANDS.START_QUIZ, async (ctx) => {
  await ctx.conversation.enter(CONVERSATION_NAME.QUIZ_PROGRESS)
})

domBot.command(BOT_COMMANDS.TERMS, async (ctx) => {
  await ctx.conversation.enter(CONVERSATION_NAME.TERMS_AGREEMENT)
})

/** CALLBACKS */

// domBot.callbackQuery(CALLBACK.QUIZ_CANCEL, async (ctx) => {
//     await ctx.conversation.exit(CONVERSATION_NAME.QUIZ_PROGRESS);
//     await ctx.answerCallbackQuery( firstQuiz.getResult() );
// });

// domBot.callbackQuery(CALLBACK.TERMS_YES, async (ctx) => {
//     if(ctx.session.hasTermsAgreement){
//         await ctx.conversation.enter(CONVERSATION_NAME.TERMS_AGREEMENT)
//     }
// });

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

domBot.errorBoundary((err) => console.error(BOT_ERROR.CONVERSATION, err))
