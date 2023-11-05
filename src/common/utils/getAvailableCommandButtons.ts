import { InlineKeyboard } from "grammy"
import botCommandsInfo from "../consts/botCommandsInfo"
import { SessionData } from "../types/sessionData"

export default function getAvailableCommandButtons(
  session: SessionData
): InlineKeyboard {
  const availableCommands = Object.entries(botCommandsInfo)
    .filter(([_command, info]) => {
      return session.hasTermsAgreement || !info.withAgreements
    })
    .map(([command, info]) => {
      return [{ text: info.descr, callback_data: JSON.stringify({ command }) }]
    })

  return new InlineKeyboard(availableCommands)
}
