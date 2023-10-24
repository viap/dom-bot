import botCommandsInfo from "../../common/consts/botCommandsInfo"
import { BOT_TEXTS } from "../../common/enums/botTexts.enum"
import { SessionData } from "../../common/types/sessionData"

export default function getAvailableCommandsMessage(
  session: SessionData
): string {
  const availableCommands = Object.entries(botCommandsInfo)
    .filter(([_command, info]) => {
      return session.hasTermsAgreement || !info.withAgreements
    })
    .map(([command, info]) => {
      return `/${command} - ${info.descr}`
    })

  return `${BOT_TEXTS.SHOW_COMMAND}\r\n\r\n${availableCommands.join("\r\n")}`
}
