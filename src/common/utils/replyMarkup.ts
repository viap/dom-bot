import {
  ParseMode,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from "@grammyjs/types"
import { Keyboard } from "grammy"
import { KeyboardButton } from "grammy/types"

export const ReplyMarkup = {
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
}
