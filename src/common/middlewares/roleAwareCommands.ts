import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { MyContext } from "@/common/types/myContext"
import { getLeadingCommand } from "@/common/utils/getFilterByCommand"
import {
  getRoleAwareBotCommands,
  hasManualCommandAccess,
} from "@/common/utils/manualCommand"
import { NextFunction } from "grammy"
import { BotCommand, BotCommandScopeChat } from "grammy/types"

export type RoleAwareCommandsPlan =
  | {
      action: "set"
      commands: Array<BotCommand>
      scope: BotCommandScopeChat
    }
  | {
      action: "delete"
      scope: BotCommandScopeChat
    }

export function getRoleAwareCommandsPlan(
  ctx: MyContext
): RoleAwareCommandsPlan | undefined {
  if (ctx.chat?.type !== "private" || !ctx.session.user) {
    return undefined
  }

  const roles = ctx.session.user.roles
  const scope: BotCommandScopeChat = {
    type: "chat",
    chat_id: ctx.chat.id,
  }

  return hasManualCommandAccess(roles)
    ? { action: "set", commands: getRoleAwareBotCommands(roles), scope }
    : { action: "delete", scope }
}

export async function syncRoleAwareBotCommands(
  ctx: MyContext,
  plan?: RoleAwareCommandsPlan
): Promise<boolean> {
  const resolvedPlan = plan || getRoleAwareCommandsPlan(ctx)
  if (!resolvedPlan) {
    return true
  }

  try {
    if (resolvedPlan.action === "set") {
      await ctx.api.setMyCommands(resolvedPlan.commands, {
        scope: resolvedPlan.scope,
      })
    } else {
      await ctx.api.deleteMyCommands({ scope: resolvedPlan.scope })
    }
    return true
  } catch (error) {
    console.error(
      "[syncRoleAwareBotCommands] sync failed:",
      getSafeErrorDetails(error)
    )
    return false
  }
}

export async function syncRoleAwareCommandsOnChange(
  ctx: MyContext,
  next: NextFunction
): Promise<void> {
  const plan = getRoleAwareCommandsPlan(ctx)
  const desiredKey = plan ? JSON.stringify(plan) : undefined
  const isStart = getLeadingCommand(ctx) === BOT_COMMANDS.START

  if (
    plan &&
    desiredKey &&
    (isStart || ctx.session.syncedCommandsKey !== desiredKey)
  ) {
    const synced = await syncRoleAwareBotCommands(ctx, plan)
    if (synced) {
      Object.assign(ctx.session, { syncedCommandsKey: desiredKey })
    }
  }

  await next()
}
