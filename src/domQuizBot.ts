import {
  conversations,
  createConversation,
  type Conversation,
  type ConversationFlavor
} from "@grammyjs/conversations"
import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  session,
  SessionFlavor
} from "grammy"
import {
  BOT_COMMANDS,
  BOT_COMMANDS_DESCR,
  BOT_ERROR,
  BOT_MSG,
  CONVERSATION_NAME,
  TOKEN
} from "./config/consts"
import { QuizProgress } from "./conversations/quizProgress"
import { Terms } from "./conversations/terms"
import { firstQuiz } from "./modules/Quiz/Entities/firstQuiz"
import { SessionData } from "./types"

import * as MongoStorage from "@grammyjs/storage-mongodb"
import mongoose from "mongoose"
import db_config from "./config/db"

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor
type MyConversation = Conversation<MyContext>

export const domBot = new Bot<MyContext>(TOKEN)
// const privateBot = domBot.chatType("private")

/** COMMANDS */

domBot.api.setMyCommands([
  { command: BOT_COMMANDS.START, description: BOT_COMMANDS_DESCR.START },
  {
    command: BOT_COMMANDS.SELECT_QUIZ,
    description: BOT_COMMANDS_DESCR.SELECT_QUIZ,
  },
  { command: BOT_COMMANDS.TERMS, description: BOT_COMMANDS_DESCR.TERMS },
])

/** DB CONNECTION */

await mongoose.connect(db_config.url, db_config.opts)
console.log("DB: connected")

const collection =
  mongoose.connection.db.collection<MongoStorage.ISession>("sessions")

/** SESSION */

function sessionInit(): SessionData {
  return { hasTermsAgreement: false }
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
    storage: new MongoStorage.MongoDBAdapter<SessionData>({ collection }),
  })
)

/** CONVERSATIONS */

const quizProgress = new QuizProgress<MyContext>(firstQuiz)
const terms = new Terms<MyContext>()

domBot.use(conversations())
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

domBot.command(BOT_COMMANDS.START, async (ctx) => {
  await ctx.conversation.exit()
  await ctx.reply(BOT_MSG.WELCOME)
})

domBot.command(BOT_COMMANDS.SELECT_QUIZ, async (ctx) => {
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
