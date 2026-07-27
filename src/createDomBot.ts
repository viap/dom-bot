import { conversations } from "@grammyjs/conversations"
import {
  Bot,
  BotConfig,
  Context,
  GrammyError,
  HttpError,
  MiddlewareFn,
  session,
  StorageAdapter,
} from "grammy"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { apiLoginByTelegram } from "@/common/middlewares/apiLoginByTelegram"
import { MyContext } from "@/common/types/myContext"
import { PrimitiveValues } from "@/common/types/primitiveValues"
import { SessionData, defaultSessionData } from "@/common/types/sessionData"
import getAvailableCommandButtons from "@/common/utils/getAvailableCommandButtons"
import getFilterByCommand from "@/common/utils/getFilterByCommand"
import {
  MANUAL_COMMAND_UNAVAILABLE_TEXT,
  getManualInstructionText,
  getRoleAwareBotCommands,
  hasManualCommandAccess,
} from "@/common/utils/manualCommand"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { BotConversations } from "@/conversations"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { DatePicker } from "@/components/DatePicker/datePicker"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import MenuBlock from "@/components/MenuBlock/menuBlock"

export type CreateDomBotOptions = {
  token?: string
  botConfig?: BotConfig<MyContext>
  sessionStorage: StorageAdapter<SessionData>
  authMiddleware?: MiddlewareFn<MyContext>
}

export function sessionInit(): SessionData {
  // NOTICE: should create a new object otherwise several chats might share the same session object in memory
  // https://grammy.dev/plugins/session#initial-session-data
  return structuredClone(defaultSessionData) as SessionData
}

export function getSessionKey(ctx: Context): string | undefined {
  // Give every user their one personal session storage per chat with the bot
  // (an independent session for each group and their private chat)
  return ctx.from === undefined || ctx.chat === undefined
    ? undefined
    : `${ctx.from.id}/${ctx.chat.id}`
}

export async function syncRoleAwareBotCommands(ctx: MyContext): Promise<void> {
  try {
    if (ctx.chat?.type !== "private" || !ctx.session.user) {
      return
    }

    const roles = ctx.session.user.roles
    const scope = { type: "chat" as const, chat_id: ctx.chat.id }

    if (hasManualCommandAccess(roles)) {
      await ctx.api.setMyCommands(getRoleAwareBotCommands(roles), { scope })
    } else {
      await ctx.api.deleteMyCommands({ scope })
    }
  } catch (error) {
    console.error("[syncRoleAwareBotCommands] sync failed:", error)
  }
}

export type CallbackData = {
  [key: string]: PrimitiveValues | Array<PrimitiveValues>
}

export function parseCallbackData(data?: string): CallbackData | undefined {
  try {
    return JSON.parse(data || "")
  } catch {
    return undefined
  }
}

export async function handleCallbackData(
  ctx: MyContext,
  data: CallbackData
): Promise<void> {
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
}

export function createDomBot({
  token = process.env.TOKEN || "",
  botConfig,
  sessionStorage,
  authMiddleware = apiLoginByTelegram,
}: CreateDomBotOptions): Bot<MyContext> {
  const domBot = new Bot<MyContext>(token, botConfig)

  DatePicker.setBotInstance(domBot)

  domBot.use(
    session({
      getSessionKey,
      initial: sessionInit,
      storage: sessionStorage,
    })
  )

  // FIXME: not necessary to send check token before all requests
  /** API: login */
  domBot.use(authMiddleware)

  /** CONVERSATIONS: init */
  domBot.use(conversations())

  /** COMMAND HANDLERS: start */
  domBot.command(BOT_COMMANDS.START, async (ctx) => {
    try {
      await ctx.conversation.exit()
    } catch (error) {
      console.log(BOT_ERRORS.CONVERSATION_EXIT, error)
    }

    await syncRoleAwareBotCommands(ctx)

    await ctx.reply(BOT_TEXTS.WELCOME, {
      reply_markup: getAvailableCommandButtons(ctx.session),
    })
  })

  /** CONVERSATIONS: use */
  domBot
    .filter(getFilterByCommand(BOT_COMMANDS.TERMS_AGREEMENT))
    .use(
      BotConversations.getMiddlewareByName(CONVERSATION_NAMES.TERMS_AGREEMENT)
    )

  domBot
    .filter(getFilterByCommand(BOT_COMMANDS.REQUISITES))
    .use(BotConversations.getMiddlewareByName(CONVERSATION_NAMES.REQUISITES))

  domBot
    .filter(getFilterByCommand(BOT_COMMANDS.MENU))
    .use(
      BotConversations.getMiddlewareByName(CONVERSATION_NAMES.SELECT_MENU_ITEM)
    )

  /* CALLBACKS */
  domBot.on("callback_query:data", async (ctx: MyContext) => {
    const data = parseCallbackData(ctx.callbackQuery?.data)

    if (!data) {
      return
    }

    await handleCallbackData(ctx, data)
  })

  /** COMMAND HANDLERS */
  domBot.command(BOT_COMMANDS.TERMS_AGREEMENT, async (ctx) => {
    await ctx.conversation.reenter(CONVERSATION_NAMES.TERMS_AGREEMENT)
  })

  /** COMMAND HANDLERS */
  domBot.command(BOT_COMMANDS.REQUISITES, async (ctx) => {
    await ctx.conversation.enter(CONVERSATION_NAMES.REQUISITES, {
      overwrite: true,
    })
  })

  domBot.command(BOT_COMMANDS.MENU, async (ctx) => {
    await ctx.conversation.enter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
  })

  domBot.command(BOT_COMMANDS.MANUAL, async (ctx) => {
    try {
      await ctx.conversation.exit()
    } catch (error) {
      console.log(BOT_ERRORS.CONVERSATION_EXIT, error)
    }

    await ctx.reply(
      getManualInstructionText(ctx.session.user?.roles) ||
        MANUAL_COMMAND_UNAVAILABLE_TEXT
    )
  })

  /** MESSAGE HANDLERS */

  domBot.on("message", async (ctx) => {
    // const activeConversations = await ctx.conversation.active()
    // if (Object.keys(activeConversations).length === 0) {
    // }
    await ctx.reply(
      `${BOT_TEXTS.DEFAULT} \\- ${ReplyMarkup.bold(ctx.message.text)}` +
        `${ReplyMarkup.newLine}${BOT_TEXTS.RELOAD} /${BOT_COMMANDS.START}`,
      {
        reply_markup: getAvailableCommandButtons(ctx.session),
        ...ReplyMarkup.parseModeV2,
      }
    )
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

  return domBot
}
