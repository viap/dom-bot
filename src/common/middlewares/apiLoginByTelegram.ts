import { isValidToken } from "@/api/controllerAuth/isValidToken"
import { loginByTelegram } from "@/api/controllerAuth/loginByTelegram"
import { refreshToken } from "@/api/controllerAuth/refreshToken"
import { getPsychologist } from "@/api/controllerPsychologists/getPsychologist"
import { getUser } from "@/api/controllerUsers/getUser"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { NextFunction } from "grammy"
import { TelegramUserDto } from "../dto/telegramUser.dto"
import { BOT_TEXTS } from "../enums/botTexts"
import { ROLES } from "../enums/roles"
import { MyContext } from "../types/myContext"

export const apiLoginByTelegram = async (
  ctx: MyContext,
  next: NextFunction
) => {
  if (!ctx.from || ctx.from.is_bot) {
    return next()
  }

  if (!(await isValidToken(ctx))) {
    delete ctx.session.token
  }

  const isStartBotCommand =
    ctx.update.message?.text === `/${BOT_COMMANDS.START}`

  if (ctx.session.token && isStartBotCommand) {
    await refreshToken(ctx)
      .then((data) => {
        ctx.session.token = data.auth_token
      })
      .catch((error) => {
        console.error("[apiLoginByTelegram] refreshToken failed:", error)
        delete ctx.session.token
      })
      .finally(() => {
        // NOTICE: сlearing user and psychologist data for re-query
        delete ctx.session.user
        delete ctx.session.psychologist
      })
  }

  if (!ctx.session.token) {
    await loginByTelegram(ctx, {
      ...ctx.from,
      id: String(ctx.from.id),
    } as TelegramUserDto)
      .then((data) => {
        // NOTICE: save token into session
        ctx.session.token = data.auth_token
      })
      .catch((error) => {
        console.error("[apiLoginByTelegram] loginByTelegram failed:", error)
      })
  }

  if (ctx.session.token) {
    try {
      if (!ctx.session.user) {
        ctx.session.user = await getUser(ctx)
      }

      const isPsychologist = ctx.session.user.roles.includes(ROLES.PSYCHOLOGIST)

      if (isPsychologist && !ctx.session.psychologist) {
        ctx.session.psychologist = await getPsychologist(ctx).catch(
          () => undefined
        )
      }

      if (!isPsychologist && ctx.session.psychologist) {
        delete ctx.session.psychologist
      }
    } catch (err) {
      console.error("[apiLoginByTelegram] getUser failed:", err)
      delete ctx.session.token
      return ctx.reply(BOT_TEXTS.UNAVAILABLE)
    }
  }

  if (!ctx.session.token) {
    return ctx.reply(BOT_TEXTS.UNAVAILABLE)
  }

  return next()
}
