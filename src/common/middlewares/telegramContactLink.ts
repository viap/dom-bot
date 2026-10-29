import {
  cancelTelegramContactLink,
  confirmTelegramContactLink,
} from "@/api/controllerTelegramContact/confirmTelegramContactLink"
import { TelegramUserDto } from "@/common/dto/telegramUser.dto"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { MyContext } from "@/common/types/myContext"
import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { isCommandAddressedToOtherBot } from "@/common/utils/getFilterByCommand"
import { InlineKeyboard, NextFunction } from "grammy"

const APPLICATION_LINK_PATTERN =
  /^\/start(?:@[A-Za-z0-9_]+)?\s+app_([A-Za-z0-9_-]{43})$/
const APPLICATION_LINK_CALLBACK_PATTERN =
  /^appcontact:(confirm|cancel):([A-Za-z0-9_-]{43})$/

export function getTelegramContactStartToken(
  ctx: MyContext
): string | undefined {
  if (ctx.chat?.type !== "private" || isCommandAddressedToOtherBot(ctx)) {
    return undefined
  }

  return APPLICATION_LINK_PATTERN.exec(ctx.message?.text?.trim() || "")?.[1]
}

type TelegramContactLinkDependencies = {
  confirm: typeof confirmTelegramContactLink
  cancel: typeof cancelTelegramContactLink
}

export function createTelegramContactLinkMiddleware(
  dependencies: Partial<TelegramContactLinkDependencies> = {}
) {
  const deps: TelegramContactLinkDependencies = {
    confirm: confirmTelegramContactLink,
    cancel: cancelTelegramContactLink,
    ...dependencies,
  }
  return async (ctx: MyContext, next: NextFunction) => {
    const startToken = getTelegramContactStartToken(ctx)
    const callbackMatch = APPLICATION_LINK_CALLBACK_PATTERN.exec(
      ctx.callbackQuery?.data || ""
    )
    if (
      (!startToken && !callbackMatch) ||
      !ctx.from ||
      !ctx.chat ||
      ctx.chat.type !== "private" ||
      ctx.from.is_bot
    ) {
      return next()
    }

    if (startToken) {
      await ctx.reply(BOT_TEXTS.TELEGRAM_CONTACT_CONFIRM, {
        reply_markup: new InlineKeyboard()
          .text(
            BOT_TEXTS.TELEGRAM_CONTACT_CONFIRM_ACTION,
            `appcontact:confirm:${startToken}`
          )
          .text(
            BOT_TEXTS.TELEGRAM_CONTACT_CANCEL_ACTION,
            `appcontact:cancel:${startToken}`
          ),
      })
      return
    }

    const action = callbackMatch?.[1]
    const callbackToken = callbackMatch?.[2]
    if (!action || !callbackToken) return next()
    await ctx.answerCallbackQuery().catch(() => undefined)
    await ctx.editMessageReplyMarkup().catch(() => undefined)

    try {
      if (action === "cancel") {
        await deps.cancel(callbackToken)
        await ctx.reply(BOT_TEXTS.TELEGRAM_CONTACT_CANCELLED)
        return
      }
      const result = await deps.confirm(
        callbackToken,
        String(ctx.chat.id),
        { ...ctx.from, id: String(ctx.from.id) } as TelegramUserDto
      )
      const message =
        result.status === "linked"
          ? BOT_TEXTS.TELEGRAM_CONTACT_LINKED
          : result.status === "cancelled"
          ? BOT_TEXTS.TELEGRAM_CONTACT_CANCELLED
          : result.status === "in_progress"
          ? BOT_TEXTS.TELEGRAM_CONTACT_IN_PROGRESS
          : BOT_TEXTS.TELEGRAM_CONTACT_ALREADY_LINKED
      await ctx.reply(message)
    } catch (error) {
      console.error(
        "[telegramContactLink] confirmation failed:",
        getSafeErrorDetails(error)
      )
      await ctx.reply(BOT_TEXTS.TELEGRAM_CONTACT_LINK_FAILED)
    }
  }
}

export const telegramContactLink = createTelegramContactLinkMiddleware()
