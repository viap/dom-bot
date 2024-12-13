import { InlineKeyboard } from "grammy"
import { SessionData } from "@/common/types/sessionData"
import botCommandsInfo from "@/common/consts/botCommandsInfo"

export default function getAvailableCommandButtons(
  session: SessionData
): InlineKeyboard {
  const availableCommands = Object.entries(botCommandsInfo)
    .filter(([, info]) => {
      return session.hasTermsAgreement || !info.withAgreements
    })
    .map(([command, info]) => {
      return [{ text: info.descr, callback_data: JSON.stringify({ command }) }]
    })

  return new InlineKeyboard(availableCommands)
}
