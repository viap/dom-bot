import { DEFAULT_BOT_COMMANDS } from "@/common/consts/botCommands"
import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_COMMANDS_DESCR } from "@/common/enums/botCommandsDescr"
import { ROLES } from "@/common/enums/roles"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { BotCommand } from "grammy/types"

export const EDITOR_MANUAL_LINK =
  "https://docs.google.com/presentation/d/1mIkoYS-gRPEXqx_CWGsL67GhUFptuWB0M1glpc_GGo4/edit?usp=drive_link"

export const PSYCHOLOGIST_MANUAL_LINK =
  "https://docs.google.com/presentation/d/1bpbpc5ipIrwF0QZY2E4XWddTmAkz6Cg2Lb4x8UjQK00/edit?usp=drive_link"

export const MANUAL_COMMAND_UNAVAILABLE_TEXT =
  "Инструкция доступна только для редакторов и психологов."

function hasRole(roles: Array<ROLES>, role: ROLES): boolean {
  return roles.includes(role)
}

export function hasManualCommandAccess(roles: Array<ROLES> = []): boolean {
  return hasRole(roles, ROLES.EDITOR) || hasRole(roles, ROLES.PSYCHOLOGIST)
}

export function getRoleAwareBotCommands(
  roles: Array<ROLES> = []
): Array<BotCommand> {
  const commands = [...DEFAULT_BOT_COMMANDS]

  if (!hasManualCommandAccess(roles)) {
    return commands
  }

  return commands.concat([
    {
      command: BOT_COMMANDS.MANUAL,
      description: BOT_COMMANDS_DESCR.MANUAL,
    },
  ])
}

export function getManualInstructionText(
  roles: Array<ROLES> = []
): string | undefined {
  const instructions: Array<string> = []

  if (hasRole(roles, ROLES.EDITOR)) {
    instructions.push(`Инструкция для редакторов: ${EDITOR_MANUAL_LINK}`)
  }

  if (hasRole(roles, ROLES.PSYCHOLOGIST)) {
    instructions.push(`Инструкция для психологов: ${PSYCHOLOGIST_MANUAL_LINK}`)
  }

  return instructions.length
    ? instructions.join(ReplyMarkup.doubleNewLine)
    : undefined
}
