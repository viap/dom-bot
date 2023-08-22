import { MyContext } from "../../common/types/myContext"
import { isValidToken } from "../../api/controllerAuth/isValidToken"
import { loginByTelegram } from "../../api/controllerAuth/loginByTelegram"
import { TelegramUserDto } from "../dto/telegramUser.dto"
import { BOT_TEXTS } from "../enums/botTexts.enum"
import { NextFunction } from "grammy"

export const apiLoginByTelegram = async (
  ctx: MyContext,
  next: NextFunction
) => {
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
}
