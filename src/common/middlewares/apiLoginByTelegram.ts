import { loginByTelegram } from "@/api/controllerAuth/loginByTelegram"
import { getPsychologist } from "@/api/controllerPsychologists/getPsychologist"
import { getUser } from "@/api/controllerUsers/getUser"
import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { TelegramUserDto } from "@/common/dto/telegramUser.dto"
import { UserDto } from "@/common/dto/user.dto"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
import { getLeadingCommand } from "@/common/utils/getFilterByCommand"
import {
  normalizeRoles,
  tokenMatchesUser,
  tokenUserIdMatches,
} from "@/common/utils/interactionIdentity"
import { AxiosRequestConfig, isAxiosError } from "axios"
import { NextFunction } from "grammy"
import { User } from "grammy/types"

const AUTH_REQUEST_CONFIG: AxiosRequestConfig = { timeout: 10_000 }

type AuthSnapshot = Pick<
  MyContext["session"],
  "token" | "user" | "psychologist"
>

export const apiLoginByTelegram = async (
  ctx: MyContext,
  next: NextFunction
) => {
  if (!ctx.from || !ctx.chat || ctx.from.is_bot) {
    return next()
  }

  const previous: AuthSnapshot = {
    token: ctx.session.token,
    user: ctx.session.user,
    psychologist: ctx.session.psychologist,
  }
  let verifiedIdentity = false

  try {
    const resolved = await resolveCurrentIdentity(
      ctx,
      ctx.from,
      getLeadingCommand(ctx) === BOT_COMMANDS.START
    )

    verifiedIdentity = true
    ctx.session.token = resolved.token
    ctx.session.user = resolved.user

    await alignPsychologistState(ctx, previous, resolved.user)
  } catch (error) {
    if (!verifiedIdentity) {
      restoreAuthState(ctx, previous)
    }

    console.error(
      "[apiLoginByTelegram] authentication refresh failed:",
      getSafeErrorDetails(error)
    )

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery().catch(() => undefined)
    }
    return ctx.reply(BOT_TEXTS.UNAVAILABLE)
  }

  return next()
}

async function resolveCurrentIdentity(
  ctx: MyContext,
  from: User,
  forceLogin: boolean
): Promise<{ token: string; user: UserDto }> {
  let token = ctx.session.token
  let user: UserDto | undefined

  if (token && !forceLogin) {
    ctx.session.token = token
    try {
      user = await getUser(ctx, currentUserAlias, AUTH_REQUEST_CONFIG)
    } catch (error) {
      if (!isCredentialRejection(error)) {
        throw error
      }
    }
  }

  if (!token || !user || !tokenMatchesUser(token, user)) {
    token = await loginCurrentTelegramUser(ctx, from)
    ctx.session.token = token
    user = await getUser(ctx, currentUserAlias, AUTH_REQUEST_CONFIG)
  }

  assertTokenIdentity(token, user)
  if (!tokenMatchesUser(token, user)) {
    throw new Error("User roles changed during token alignment")
  }

  return { token, user }
}

async function alignPsychologistState(
  ctx: MyContext,
  previous: AuthSnapshot,
  user: UserDto
): Promise<void> {
  if (!user.roles.includes(ROLES.PSYCHOLOGIST)) {
    delete ctx.session.psychologist
    return
  }

  const cachedPsychologist = getReusablePsychologist(previous, user)
  const previousRoles = normalizeRoles(previous.user?.roles)
  const currentRoles = normalizeRoles(user.roles)
  const identityOrRolesChanged =
    previous.user?._id !== user._id ||
    JSON.stringify(previousRoles) !== JSON.stringify(currentRoles)
  const isStart = getLeadingCommand(ctx) === BOT_COMMANDS.START

  if (cachedPsychologist && !identityOrRolesChanged && !isStart) {
    ctx.session.psychologist = cachedPsychologist
    return
  }

  delete ctx.session.psychologist
  try {
    const psychologist = await getPsychologist(
      ctx,
      currentUserAlias,
      AUTH_REQUEST_CONFIG
    )

    if (psychologist) {
      ctx.session.psychologist = psychologist
    }
  } catch (error) {
    if (!isTransportOrServerFailure(error) || !cachedPsychologist) {
      throw error
    }
    ctx.session.psychologist = cachedPsychologist
  }
}

async function loginCurrentTelegramUser(
  ctx: MyContext,
  from: User
): Promise<string> {
  const result = await loginByTelegram(
    ctx,
    { ...from, id: String(from.id) } as TelegramUserDto,
    AUTH_REQUEST_CONFIG
  )
  return result.auth_token
}

function assertTokenIdentity(token: string, user: UserDto): void {
  // `/users/me` should make this invariant true. Keep the check as a defense
  // against malformed tokens or a future API regression crossing identities.
  if (!tokenUserIdMatches(token, user)) {
    throw new Error("Authenticated user identity does not match token")
  }
}

function getReusablePsychologist(
  previous: AuthSnapshot,
  user: UserDto
): PsychologistDto | undefined {
  const psychologist = previous.psychologist
  if (
    !psychologist ||
    typeof psychologist !== "object" ||
    psychologist.user?._id !== user._id
  ) {
    return undefined
  }

  return psychologist
}

function restoreAuthState(ctx: MyContext, previous: AuthSnapshot): void {
  restoreOptional(ctx.session, "token", previous.token)
  restoreOptional(ctx.session, "user", previous.user)
  restoreOptional(ctx.session, "psychologist", previous.psychologist)
}

function restoreOptional<Key extends "token" | "user" | "psychologist">(
  session: MyContext["session"],
  key: Key,
  value: MyContext["session"][Key]
): void {
  if (value === undefined) {
    delete session[key]
  } else {
    session[key] = value
  }
}

function isCredentialRejection(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false
  }

  return error.response?.status === 401 || error.response?.status === 403
}

function isTransportOrServerFailure(error: unknown): boolean {
  return (
    isAxiosError(error) &&
    (error.response === undefined || (error.response.status ?? 0) >= 500)
  )
}

function getSafeErrorDetails(error: unknown): {
  message: string
  status?: number
  url?: string
} {
  if (isAxiosError(error)) {
    return {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    }
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error",
  }
}
