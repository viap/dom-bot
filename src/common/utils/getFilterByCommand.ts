import botCommandsInfo from "../consts/botCommandsInfo"
import { BOT_COMMANDS } from "../enums/botCommands"
import { MyContext } from "../types/myContext"

function getLeadingCommand(ctx: MyContext): string | undefined {
  const message = ctx.message?.text || ""
  const leadingBotCommandEntity = ctx.message?.entities?.find(
    (entity) => entity.type === "bot_command" && entity.offset === 0
  )

  if (leadingBotCommandEntity) {
    return message
      .slice(1, leadingBotCommandEntity.length)
      .split("@")[0]
      .toLowerCase()
  }

  const command = /^\/([a-zA-Z0-9_]+)(?:@[a-zA-Z0-9_]+)?(?:\s|$)/.exec(message)

  return command?.[1]?.toLowerCase()
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
