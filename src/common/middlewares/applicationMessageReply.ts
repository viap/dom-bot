import {
  ApplicationMessageThread,
  listApplicationMessageThreads,
  receiveApplicationMessageReply,
} from "@/api/controllerApplicationMessages/applicationMessages"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { MyContext } from "@/common/types/myContext"
import {
  APPLICATION_REPLY_CANCEL_TEXT,
  APPLICATION_THREADS_BUTTON_TEXT,
  applicationMainCallback,
  applicationReplyCallback,
  applicationThreadsCallback,
  getApplicationReplyPromptKeyboard,
  getApplicationReplySuccessKeyboard,
  parseApplicationMessageAction,
} from "@/common/utils/applicationMessaging"
import { parseCallbackData } from "@/common/utils/callbackRouting"
import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { getLeadingCommand } from "@/common/utils/getFilterByCommand"
import { InlineKeyboard, NextFunction } from "grammy"

const OFFICIAL_MESSAGE_PREFIX = "DOM — "
const REPLY_SELECTION_TTL_MS = 15 * 60 * 1000
const TRANSCRIPT_CHUNK_LIMIT = 3_800
const TRANSCRIPT_SEPARATOR = "\n\n────────\n\n"

type ApplicationMessagingDependencies = {
  listThreads: typeof listApplicationMessageThreads
  receiveReply: typeof receiveApplicationMessageReply
  now: () => number
}

const defaultDependencies: ApplicationMessagingDependencies = {
  listThreads: listApplicationMessageThreads,
  receiveReply: receiveApplicationMessageReply,
  now: Date.now,
}

const FORM_TYPE_LABELS: Record<string, string> = {
  general: "Общее обращение",
  partnership: "Партнёрство",
  program_enrollment: "Запись на программу",
  event_registration: "Запись на мероприятие",
  corporate_training: "Корпоративное обучение",
  specialist_request: "Подбор специалиста",
  supervision: "Супервизия",
}

export function getApplicationReplyPayload(ctx: MyContext) {
  const message = ctx.message
  const repliedMessage = message?.reply_to_message
  if (
    ctx.chat?.type !== "private" ||
    !ctx.from ||
    ctx.from.is_bot ||
    !repliedMessage?.from?.is_bot ||
    !message ||
    !repliedMessage.text?.startsWith(OFFICIAL_MESSAGE_PREFIX)
  ) {
    return null
  }

  return {
    privateChatId: String(ctx.chat.id),
    telegramUserId: String(ctx.from.id),
    telegramMessageId: message.message_id,
    replyToTelegramMessageId: repliedMessage.message_id,
    text: message.text,
  }
}

export function createApplicationMessageReplyMiddleware(
  dependencies: Partial<ApplicationMessagingDependencies> = {}
) {
  const deps = { ...defaultDependencies, ...dependencies }
  return async (ctx: MyContext, next: NextFunction) => {
    if (ctx.chat?.type !== "private" || !ctx.from || ctx.from.is_bot) {
      return next()
    }

    const payload = getApplicationReplyPayload(ctx)
    if (payload) {
      await handleNativeReply(ctx, payload, deps)
      return
    }

    const action = parseApplicationMessageAction(ctx.callbackQuery?.data)
    if (action) {
      await ctx.answerCallbackQuery().catch(() => undefined)
      switch (action.type) {
        case "reply":
          await selectApplicationThread(ctx, action.applicationId, deps)
          return
        case "threads":
          await showApplicationThreads(ctx, action.page, deps)
          return
        case "main":
          clearReplySelection(ctx)
          await showApplicantMainMenu(ctx)
          return
        case "cancel":
          clearReplySelection(ctx)
          await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_CANCELLED)
          return
      }
    }

    if (ctx.callbackQuery?.data?.startsWith("appmsg:")) {
      await ctx.answerCallbackQuery().catch(() => undefined)
      return
    }

    const command = getLeadingCommand(ctx)
    const callbackCommand = parseCallbackData(ctx.callbackQuery?.data)?.command
    const opensMenu =
      command === BOT_COMMANDS.MENU || callbackCommand === BOT_COMMANDS.MENU
    if (command === BOT_COMMANDS.START || opensMenu) {
      clearReplySelection(ctx)
      if (opensMenu) {
        await refreshThreadAvailability(ctx, deps)
      }
      return next()
    }

    if (ctx.message?.text === APPLICATION_THREADS_BUTTON_TEXT) {
      await showApplicationThreads(ctx, 0, deps)
      return
    }

    if (ctx.session.applicationMessaging?.selectedApplicationId) {
      await handleSelectedThreadReply(ctx, deps)
      return
    }

    return next()
  }
}

export const applicationMessageReply = createApplicationMessageReplyMiddleware()

async function handleNativeReply(
  ctx: MyContext,
  payload: NonNullable<ReturnType<typeof getApplicationReplyPayload>>,
  deps: ApplicationMessagingDependencies
) {
  try {
    const result = await deps.receiveReply(payload)
    if (!result.accepted) {
      await ctx.reply(BOT_TEXTS.APPLICATION_THREAD_UNAVAILABLE)
      return
    }
    clearReplySelection(ctx)
    await ctx.reply(
      result.reason === "text_required"
        ? BOT_TEXTS.APPLICATION_REPLY_TEXT_ONLY
        : BOT_TEXTS.APPLICATION_REPLY_RECEIVED,
      result.applicationId && result.reason !== "text_required"
        ? {
            reply_markup: getApplicationReplySuccessKeyboard(
              result.applicationId
            ),
          }
        : undefined
    )
  } catch (error) {
    console.error(
      "[applicationMessageReply] failed:",
      getSafeErrorDetails(error)
    )
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_FAILED)
  }
}

async function selectApplicationThread(
  ctx: MyContext,
  applicationId: string,
  deps: ApplicationMessagingDependencies
) {
  try {
    const response = await deps.listThreads({
      ...getTelegramIdentity(ctx),
      applicationId,
      page: 0,
    })
    const thread = response.threads.find(
      (candidate) => candidate.applicationId === applicationId
    )
    if (!response.enabled || !thread) {
      clearReplySelection(ctx)
      await ctx.reply(BOT_TEXTS.APPLICATION_THREAD_UNAVAILABLE)
      return
    }

    ctx.session.applicationMessaging = {
      ...ctx.session.applicationMessaging,
      selectedApplicationId: applicationId,
      selectedAt: deps.now(),
      hasThreads: true,
    }
    for (const chunk of formatApplicationThreadTranscript(thread)) {
      await ctx.reply(chunk)
    }
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_PROMPT, {
      reply_markup: getApplicationReplyPromptKeyboard(),
    })
  } catch (error) {
    console.error(
      "[applicationMessageReply] thread selection failed:",
      getSafeErrorDetails(error)
    )
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_FAILED)
  }
}

async function handleSelectedThreadReply(
  ctx: MyContext,
  deps: ApplicationMessagingDependencies
) {
  const state = ctx.session.applicationMessaging
  const applicationId = state?.selectedApplicationId
  if (!applicationId || !state?.selectedAt) return

  if (deps.now() - state.selectedAt > REPLY_SELECTION_TTL_MS) {
    clearReplySelection(ctx)
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_EXPIRED, {
      reply_markup: new InlineKeyboard().text(
        APPLICATION_THREADS_BUTTON_TEXT,
        applicationThreadsCallback()
      ),
    })
    return
  }

  if (ctx.message?.text === APPLICATION_REPLY_CANCEL_TEXT) {
    clearReplySelection(ctx)
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_CANCELLED)
    return
  }

  const text = ctx.message?.text
  if (!text) {
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_TEXT_ONLY, {
      reply_markup: getApplicationReplyPromptKeyboard(),
    })
    return
  }

  try {
    const result = await deps.receiveReply({
      ...getTelegramIdentity(ctx),
      telegramMessageId: ctx.message.message_id,
      applicationId,
      text,
    })
    if (!result.accepted) {
      clearReplySelection(ctx)
      await ctx.reply(BOT_TEXTS.APPLICATION_THREAD_UNAVAILABLE)
      return
    }
    if (result.reason === "text_required") {
      await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_TEXT_ONLY, {
        reply_markup: getApplicationReplyPromptKeyboard(),
      })
      return
    }

    clearReplySelection(ctx)
    ctx.session.applicationMessaging = {
      ...ctx.session.applicationMessaging,
      hasThreads: true,
    }
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_RECEIVED, {
      reply_markup: getApplicationReplySuccessKeyboard(applicationId),
    })
  } catch (error) {
    console.error(
      "[applicationMessageReply] selected reply failed:",
      getSafeErrorDetails(error)
    )
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_FAILED, {
      reply_markup: getApplicationReplyPromptKeyboard(),
    })
  }
}

async function showApplicationThreads(
  ctx: MyContext,
  page: number,
  deps: ApplicationMessagingDependencies
) {
  try {
    const response = await deps.listThreads({
      ...getTelegramIdentity(ctx),
      page,
    })
    ctx.session.applicationMessaging = {
      ...ctx.session.applicationMessaging,
      hasThreads: response.enabled && response.threads.length > 0,
    }

    if (!response.enabled || response.threads.length === 0) {
      await ctx.reply(BOT_TEXTS.APPLICATION_THREADS_EMPTY)
      return
    }

    const keyboard = new InlineKeyboard()
    for (const thread of response.threads) {
      keyboard
        .text(
          formatThreadLabel(thread),
          applicationReplyCallback(thread.applicationId)
        )
        .row()
    }
    if (page > 0) {
      keyboard.text("‹", applicationThreadsCallback(page - 1))
    }
    if (response.hasMore) {
      keyboard.text("›", applicationThreadsCallback(page + 1))
    }
    if (page > 0 || response.hasMore) keyboard.row()
    keyboard.text("Основное меню", applicationMainCallback())

    await ctx.reply(BOT_TEXTS.APPLICATION_THREADS_TITLE, {
      reply_markup: keyboard,
    })
  } catch (error) {
    console.error(
      "[applicationMessageReply] thread list failed:",
      getSafeErrorDetails(error)
    )
    await ctx.reply(BOT_TEXTS.APPLICATION_REPLY_FAILED)
  }
}

async function showApplicantMainMenu(ctx: MyContext) {
  if (ctx.session.user) {
    await ctx.reply(BOT_TEXTS.APPLICATION_WORK_MENU_HINT, {
      reply_markup: new InlineKeyboard().text(
        "Открыть основное меню",
        JSON.stringify({ command: BOT_COMMANDS.MENU })
      ),
    })
    return
  }
  await ctx.reply(BOT_TEXTS.APPLICATION_MAIN_MENU, {
    reply_markup: new InlineKeyboard().text(
      APPLICATION_THREADS_BUTTON_TEXT,
      applicationThreadsCallback()
    ),
  })
}

async function refreshThreadAvailability(
  ctx: MyContext,
  deps: ApplicationMessagingDependencies
) {
  try {
    const response = await deps.listThreads({
      ...getTelegramIdentity(ctx),
      page: 0,
    })
    ctx.session.applicationMessaging = {
      ...ctx.session.applicationMessaging,
      hasThreads: response.enabled && response.threads.length > 0,
    }
  } catch (error) {
    if (process.env.API_DEBUG === "true") {
      console.error(
        "[applicationMessageReply] availability refresh failed:",
        getSafeErrorDetails(error)
      )
    }
  }
}

function clearReplySelection(ctx: MyContext) {
  if (!ctx.session.applicationMessaging) return
  delete ctx.session.applicationMessaging.selectedApplicationId
  delete ctx.session.applicationMessaging.selectedAt
}

function getTelegramIdentity(ctx: MyContext) {
  if (!ctx.chat || !ctx.from) {
    throw new Error("Telegram identity is unavailable")
  }
  return {
    privateChatId: String(ctx.chat.id),
    telegramUserId: String(ctx.from.id),
  }
}

function formatThreadLabel(thread: ApplicationMessageThread): string {
  const formLabel = FORM_TYPE_LABELS[thread.formType] || "Заявка"
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Tbilisi",
  }).format(new Date(thread.createdAt))
  return `${formLabel} · ${date}`
}

export function formatApplicationThreadTranscript(
  thread: ApplicationMessageThread
): string[] {
  const applicantName = thread.applicantDisplayName?.trim() || "Заявитель"
  const entries: string[] = []
  if (thread.initialMessage?.trim()) {
    entries.push(
      formatTranscriptEntry(
        `${applicantName} · сообщение из заявки`,
        thread.initialMessage,
        thread.createdAt
      )
    )
  }
  for (const message of thread.messages || []) {
    const author =
      message.direction === "inbound"
        ? applicantName
        : `DOM — ${message.senderDisplayName?.trim() || "Команда DOM"}`
    entries.push(formatTranscriptEntry(author, message.text, message.createdAt))
  }
  return packTranscriptEntries(entries)
}

function formatTranscriptEntry(
  author: string,
  text: string,
  createdAt: string
): string {
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tbilisi",
  }).format(new Date(createdAt))
  return `${author} · ${date}\n\n${text.trim()}`
}

function packTranscriptEntries(entries: string[]): string[] {
  const chunks: string[] = []
  let current = ""
  for (const entry of entries) {
    const candidate = current
      ? `${current}${TRANSCRIPT_SEPARATOR}${entry}`
      : entry
    if (candidate.length <= TRANSCRIPT_CHUNK_LIMIT) {
      current = candidate
      continue
    }
    if (current) chunks.push(current)
    if (entry.length <= TRANSCRIPT_CHUNK_LIMIT) {
      current = entry
      continue
    }
    for (
      let offset = 0;
      offset < entry.length;
      offset += TRANSCRIPT_CHUNK_LIMIT
    ) {
      chunks.push(entry.slice(offset, offset + TRANSCRIPT_CHUNK_LIMIT))
    }
    current = ""
  }
  if (current) chunks.push(current)
  return chunks
}
