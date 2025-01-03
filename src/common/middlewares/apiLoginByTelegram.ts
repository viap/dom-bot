import { NextFunction } from "grammy"
import { MyContext } from "../types/myContext"
import { hasValidToken } from "@/api/controllerAuth/isValidToken"
import { loginByTelegram } from "@/api/controllerAuth/loginByTelegram"
import { getUser } from "@/api/controllerUsers/getUser"
import { getPsychologist } from "@/api/controllerPsychologists/getPsychologist"
import { TelegramUserDto } from "../dto/telegramUser.dto"
import { ROLES } from "../enums/roles"
import { BOT_TEXTS } from "../enums/botTexts"

export const apiLoginByTelegram = async (
  ctx: MyContext,
  next: NextFunction
) => {
  if (ctx.from && !ctx.from.is_bot) {
    if (!(await hasValidToken(ctx))) {
      delete ctx.session.token
    }

    if (!ctx.session.token) {
      await loginByTelegram(ctx, {
        ...ctx.from,
        id: ctx.from.id + "",
      } as TelegramUserDto).catch()
    }

    if (ctx.session.token) {
      ctx.user = await getUser(ctx)
      if (ctx.user.roles.includes(ROLES.PSYCHOLOGIST)) {
        ctx.psychologist = await getPsychologist(ctx).catch(() => undefined)
      }
    }
  }

  if (!ctx.session.token) {
    return await ctx.reply(BOT_TEXTS.UNAVAILABLE)
  }

  return next()
}
