import {
  ParseMode,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from "@grammyjs/types"
import { Keyboard } from "grammy"
import { KeyboardButton } from "grammy/types"
import { telegramParseModeV2CharsEscape } from "./telegramParseModeV2Chars"

export const ReplyMarkup = {
  tab: "\t",
  space: " ",
  newLine: "\r\n",
  doubleNewLine: "\r\n\r\n",
  patterns: {
    dateRu: "DD.MM.YYYY",
  },
  regExp: {
    dateRu: /([0-9]{2})\.([0-9]{2})\.([0-9]{4})/i,
  },
  emptyKeyboard: {
    reply_markup: { remove_keyboard: true } as ReplyKeyboardRemove,
  },
  oneTime: { one_time_keyboard: true } as ReplyKeyboardMarkup,
  parseModeV2: { parse_mode: "MarkdownV2" as ParseMode },
  keyboard: (keyboard: Keyboard) => {
    return { reply_markup: keyboard as ReplyKeyboardMarkup }
  },
  keyboardButtons: (buttons: Array<Array<KeyboardButton>>) => {
    return { reply_markup: new Keyboard(buttons) as ReplyKeyboardMarkup }
  },
  escapeForParseModeV2(text: string): string {
    return telegramParseModeV2CharsEscape(text)
  },
}
