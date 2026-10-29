import { confirmTelegramContactLink } from "@/api/controllerTelegramContact/confirmTelegramContactLink"
import { TelegramUserDto } from "@/common/dto/telegramUser.dto"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { MyContext } from "@/common/types/myContext"
import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { isCommandAddressedToOtherBot } from "@/common/utils/getFilterByCommand"
import { NextFunction } from "grammy"

const APPLICATION_LINK_PATTERN =
  /^\/start(?:@[A-Za-z0-9_]+)?\s+app_([A-Za-z0-9_-]{32,128})$/

export function getTelegramContactStartToken(
  ctx: MyContext
): string | undefined {
  if (ctx.chat?.type !== "private" || isCommandAddressedToOtherBot(ctx)) {
    return undefined
  }

  return APPLICATION_LINK_PATTERN.exec(ctx.message?.text?.trim() || "")?.[1]
}

export async function telegramContactLink(ctx: MyContext, next: NextFunction) {
  const startToken = getTelegramContactStartToken(ctx)
  if (!startToken || !ctx.from || !ctx.chat || ctx.from.is_bot) {
    return next()
  }

  try {
    const result = await confirmTelegramContactLink(
      startToken,
      String(ctx.chat.id),
      { ...ctx.from, id: String(ctx.from.id) } as TelegramUserDto
    )
    await ctx.reply(
      result.status === "linked"
        ? BOT_TEXTS.TELEGRAM_CONTACT_LINKED
        : BOT_TEXTS.TELEGRAM_CONTACT_ALREADY_LINKED
    )
  } catch (error) {
    console.error(
      "[telegramContactLink] confirmation failed:",
      getSafeErrorDetails(error)
    )
    await ctx.reply(BOT_TEXTS.TELEGRAM_CONTACT_LINK_FAILED)
  }
}
