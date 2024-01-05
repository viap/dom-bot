import { BOT_COMMANDS_DESCR } from "../../common/enums/botCommandsDescr.enum"
import { BOT_COMMANDS } from "../enums/botCommands.enum"
import { CONVERSATION_NAMES } from "../../conversations/enums/conversationNames"

export type BotCommandsInfo = {
  [key: string]: {
    conversation: CONVERSATION_NAMES
    descr: BOT_COMMANDS_DESCR
    withAgreements: boolean
  }
}

const botCommandsInfo: BotCommandsInfo = {
  [BOT_COMMANDS.MENU]: {
    conversation: CONVERSATION_NAMES.SELECT_MENU_ITEM,
    descr: BOT_COMMANDS_DESCR.MENU,
    withAgreements: true,
  },
  // [BOT_COMMANDS.TERMS_AGREEMENT]: {
  //   conversation: CONVERSATION_NAMES.TERMS_AGREEMENT,
  //   descr: BOT_COMMANDS_DESCR.TERMS_AGREEMENT,
  //   withAgreements: false,
  // },
}

export default botCommandsInfo
