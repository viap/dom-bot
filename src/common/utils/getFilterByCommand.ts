import botCommandsInfo from "../consts/botCommandsInfo"
import { BOT_COMMANDS } from "../enums/botCommands"
import { MyContext } from "../types/myContext"

export function getLeadingCommand(ctx: MyContext): string | undefined {
  const parsed = getLeadingCommandParts(ctx)
  if (!parsed || isCommandAddressedToOtherBot(ctx)) {
    return undefined
  }

  return parsed.command
}

export function isCommandAddressedToOtherBot(ctx: MyContext): boolean {
  const parsed = getLeadingCommandParts(ctx)
  return Boolean(
    parsed?.targetBot &&
      ctx.me?.username &&
      parsed.targetBot !== ctx.me.username.toLowerCase()
  )
}

function getLeadingCommandParts(
  ctx: MyContext
): { command: string; targetBot?: string } | undefined {
  const message = ctx.message?.text || ""
  const leadingBotCommandEntity = ctx.message?.entities?.find(
    (entity) => entity.type === "bot_command" && entity.offset === 0
  )

  const commandPrefix = leadingBotCommandEntity
    ? message.slice(0, leadingBotCommandEntity.length)
    : message
  const commandText = /^\/[a-zA-Z0-9_]+(?:@[a-zA-Z0-9_]+)?(?:\s|$)/.exec(
    commandPrefix
  )?.[0]

  if (!commandText) {
    return undefined
  }

  const [command, targetBot] = commandText.trim().slice(1).split("@")
  return {
    command: command.toLowerCase(),
    targetBot: targetBot?.toLowerCase(),
  }
}

export default function getFilterByCommand(expectedСommand: BOT_COMMANDS) {
  return async (ctx: MyContext) => {
    const command = getLeadingCommand(ctx)
    const isCommand = Boolean(command)

    const result = !isCommand || command === expectedСommand

    // NOTICE: close the current conversation to give the opportunity to start over the command
    if (
      isCommand &&
      command === expectedСommand &&
      botCommandsInfo[expectedСommand]
    ) {
      await ctx.conversation.exit(botCommandsInfo[expectedСommand].conversation)
    }

    return result
  }
}
