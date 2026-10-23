import { autoRetry } from "@grammyjs/auto-retry"
import { conversations } from "@grammyjs/conversations"
import { sequentialize } from "@grammyjs/runner"
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
import { CONVERSATION_VERSION } from "@/common/consts/conversationVersion"
import { apiLoginByTelegram } from "@/common/middlewares/apiLoginByTelegram"
import {
  clearPendingRecovery,
  createInteractionRecoveryGate,
  dispatchPendingRecovery,
  isRecoveryMenuRegistrationRequired,
} from "@/common/middlewares/interactionRecovery"
import { syncRoleAwareCommandsOnChange } from "@/common/middlewares/roleAwareCommands"
import { MyContext } from "@/common/types/myContext"
import { SessionData, defaultSessionData } from "@/common/types/sessionData"
import {
  acknowledgeCallback,
  handleCallbackData,
  parseCallbackData,
} from "@/common/utils/callbackRouting"
import getAvailableCommandButtons from "@/common/utils/getAvailableCommandButtons"
import getFilterByCommand, {
  isCommandAddressedToOtherBot,
} from "@/common/utils/getFilterByCommand"
import {
  MANUAL_COMMAND_UNAVAILABLE_TEXT,
  getManualInstructionText,
} from "@/common/utils/manualCommand"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { BotConversations } from "@/conversations"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { DatePicker } from "@/components/DatePicker/datePicker"

// Retry only Telegram rate limits (429 with a short retry_after). Network and
// 5xx errors are rethrown: retrying them can resend a message Telegram already
// delivered, and unbounded retries would stall long polling.
export const AUTO_RETRY_OPTIONS = {
  maxRetryAttempts: 3,
  maxDelaySeconds: 30,
  rethrowHttpErrors: true,
  rethrowInternalServerErrors: true,
}

export type CreateDomBotOptions = {
  token?: string
  botConfig?: BotConfig<MyContext>
  sessionStorage: StorageAdapter<SessionData>
  authMiddleware?: MiddlewareFn<MyContext>
  conversationVersion?: number
}

export function sessionInit(
  conversationVersion = CONVERSATION_VERSION
): SessionData {
  // NOTICE: should create a new object otherwise several chats might share the same session object in memory
  // https://grammy.dev/plugins/session#initial-session-data
  return {
    ...(structuredClone(defaultSessionData) as SessionData),
    interactionState: { conversationVersion },
  }
}

export function getSessionKey(ctx: Context): string | undefined {
  // Give every user their one personal session storage per chat with the bot
  // (an independent session for each group and their private chat)
  return ctx.from === undefined || ctx.chat === undefined
    ? undefined
    : `${ctx.from.id}/${ctx.chat.id}`
}

export function createDomBot({
  token = process.env.TOKEN || "",
  botConfig,
  sessionStorage,
  authMiddleware = apiLoginByTelegram,
  conversationVersion = CONVERSATION_VERSION,
}: CreateDomBotOptions): Bot<MyContext> {
  const domBot = new Bot<MyContext>(token, botConfig)
  domBot.api.config.use(autoRetry(AUTO_RETRY_OPTIONS))

  DatePicker.setBotInstance(domBot)

  domBot.use(sequentialize(getSessionKey))

  domBot.use(
    session({
      getSessionKey,
      initial: () => sessionInit(conversationVersion),
      storage: sessionStorage,
    })
  )

  // Authentication and conversation routing apply only to eligible human chat
  // updates addressed to this bot. Ignored commands must not call dom-api.
  domBot.use(async (ctx, next) => {
    if (
      getSessionKey(ctx) !== undefined &&
      !ctx.from?.is_bot &&
      !isCommandAddressedToOtherBot(ctx)
    ) {
      await next()
    }
  })

  /** API: login */
  domBot.use(authMiddleware)

  /** CONVERSATIONS: init */
  domBot.use(conversations())

  domBot.use(createInteractionRecoveryGate(conversationVersion))
  domBot.use(syncRoleAwareCommandsOnChange)

  /** COMMAND HANDLERS: start */
  domBot.command(BOT_COMMANDS.START, async (ctx) => {
    try {
      await ctx.conversation.exit()
    } catch (error) {
      console.log(BOT_ERRORS.CONVERSATION_EXIT, error)
    }

    delete ctx.session.menuDeepLink
    try {
      await ctx.reply(BOT_TEXTS.WELCOME, {
        reply_markup: getAvailableCommandButtons(ctx.session),
      })
      clearPendingRecovery(ctx)
    } catch (error) {
      console.error("[interactionRecovery] start reply failed:", error)
    }
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
    .filter(async (ctx) => {
      return (
        isRecoveryMenuRegistrationRequired(ctx) ||
        getFilterByCommand(BOT_COMMANDS.MENU)(ctx)
      )
    })
    .use(
      BotConversations.getMiddlewareByName(CONVERSATION_NAMES.SELECT_MENU_ITEM)
    )

  domBot.use(dispatchPendingRecovery)

  /* CALLBACKS */
  domBot.on("callback_query:data", async (ctx: MyContext) => {
    await acknowledgeCallback(ctx)
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
    delete ctx.session.menuDeepLink
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
