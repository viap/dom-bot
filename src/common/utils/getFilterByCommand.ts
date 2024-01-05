import botCommandsInfo from "../consts/botCommandsInfo"
import { BOT_COMMANDS } from "../enums/botCommands"
import { MyContext } from "../types/myContext"

export default function getFilterByCommand(expectedСommand: BOT_COMMANDS) {
  return async (ctx: MyContext) => {
    const commandRegEx = /\/([a-zA-Z]+)/

    const message = ctx.message?.text || ""
    const isCommand = commandRegEx.test(message)
    const command = isCommand ? commandRegEx.exec(message)?.[1] || "" : ""

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
