import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { MyContext } from "@/common/types/myContext"
import { InteractionState, PendingRecovery } from "@/common/types/sessionData"
import {
  acknowledgeCallback,
  handleCallbackData,
  parseCallbackData,
} from "@/common/utils/callbackRouting"
import { getLeadingCommand } from "@/common/utils/getFilterByCommand"
import { createAccessKey } from "@/common/utils/interactionIdentity"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { NextFunction } from "grammy"

const EXPLICIT_RECOVERY_COMMANDS = new Set<string>([
  BOT_COMMANDS.MANUAL,
  BOT_COMMANDS.REQUISITES,
  BOT_COMMANDS.TERMS_AGREEMENT,
])

export function createInteractionRecoveryGate(conversationVersion: number) {
  return async (ctx: MyContext, next: NextFunction): Promise<void> => {
    const user = ctx.session.user
    if (!user) {
      await next()
      return
    }

    const accessKey = createAccessKey(user, ctx.session.psychologist)

    const active = await ctx.conversation.active()
    const interruptedConversation = Object.values(active).some(
      (count) => count > 0
    )
    const previous = ctx.session.interactionState
    const versionMismatch =
      previous?.conversationVersion !== conversationVersion
    const accessMismatch =
      previous?.accessKey !== undefined && previous.accessKey !== accessKey
    const unknownAccessWithHistory =
      previous?.accessKey === undefined && interruptedConversation
    let pending = previous?.pendingRecovery

    if (versionMismatch || accessMismatch || unknownAccessWithHistory) {
      if (interruptedConversation) {
        await ctx.conversation.exit()
      }

      pending = pending || {
        reason: versionMismatch ? "release" : "access",
        interruptedConversation,
      }
      delete ctx.session.menuDeepLink
    }

    const interactionState: InteractionState = {
      ...previous,
      conversationVersion,
      accessKey,
      pendingRecovery: pending,
    }
    if (!pending) {
      delete interactionState.pendingRecovery
    }
    Object.assign(ctx.session, { interactionState })

    await next()
  }
}

export function isRecoveryMenuRegistrationRequired(ctx: MyContext): boolean {
  if (!ctx.session.interactionState?.pendingRecovery) {
    return false
  }

  const command = getLeadingCommand(ctx)
  return (
    command !== BOT_COMMANDS.START &&
    !EXPLICIT_RECOVERY_COMMANDS.has(command || "")
  )
}

export async function dispatchPendingRecovery(
  ctx: MyContext,
  next: NextFunction
): Promise<void> {
  const pending = ctx.session.interactionState?.pendingRecovery
  if (!pending) {
    await next()
    return
  }

  const command = getLeadingCommand(ctx)
  if (EXPLICIT_RECOVERY_COMMANDS.has(command || "")) {
    try {
      await next()
      clearPendingRecovery(ctx)
    } catch (error) {
      console.error("[interactionRecovery] explicit recovery route failed:", error)
    }
    return
  }

  if (ctx.callbackQuery) {
    await acknowledgeCallback(ctx)
    try {
      delete ctx.session.menuDeepLink
      await ctx.reply(getRecoveryText(pending))
      const callbackData = parseCallbackData(ctx.callbackQuery.data)
      const handled = callbackData
        ? await handleCallbackData(ctx, callbackData)
        : false

      if (!handled) {
        await ctx.conversation.enter(CONVERSATION_NAMES.SELECT_MENU_ITEM, {
          overwrite: true,
        })
      }
      clearPendingRecovery(ctx)
    } catch (error) {
      console.error("[interactionRecovery] callback recovery failed:", error)
      await exitPartialRecovery(ctx)
    }
    return
  }

  delete ctx.session.menuDeepLink

  try {
    await ctx.reply(getRecoveryText(pending))
    await ctx.conversation.enter(CONVERSATION_NAMES.SELECT_MENU_ITEM, {
      overwrite: true,
    })
    clearPendingRecovery(ctx)
  } catch (error) {
    console.error("[interactionRecovery] menu recovery failed:", error)
    await exitPartialRecovery(ctx)
  }
}

export function clearPendingRecovery(ctx: MyContext): void {
  const current = ctx.session.interactionState
  if (!current?.pendingRecovery) {
    return
  }

  const { pendingRecovery: _pendingRecovery, ...interactionState } = current
  Object.assign(ctx.session, { interactionState })
}

async function exitPartialRecovery(ctx: MyContext): Promise<void> {
  try {
    await ctx.conversation.exit()
  } catch (exitError) {
    console.error(BOT_ERRORS.CONVERSATION_EXIT, exitError)
  }
}

function getRecoveryText(pending: PendingRecovery): BOT_TEXTS {
  if (pending.reason === "release") {
    return pending.interruptedConversation
      ? BOT_TEXTS.RECOVERY_RELEASE_INTERRUPTED
      : BOT_TEXTS.RECOVERY_RELEASE
  }

  return pending.interruptedConversation
    ? BOT_TEXTS.RECOVERY_ACCESS_INTERRUPTED
    : BOT_TEXTS.RECOVERY_ACCESS
}
