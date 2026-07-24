import { BOT_COMMANDS_DESCR } from "@/common/enums/botCommandsDescr"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BotCommand } from "grammy/types"

export const DEFAULT_BOT_COMMANDS: ReadonlyArray<BotCommand> = [
  { command: BOT_COMMANDS.START, description: BOT_COMMANDS_DESCR.START },
  { command: BOT_COMMANDS.MENU, description: BOT_COMMANDS_DESCR.MENU },
  {
    command: BOT_COMMANDS.REQUISITES,
    description: BOT_COMMANDS_DESCR.REQUISITES,
  },
]
