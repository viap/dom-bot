import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from "@grammyjs/types"

export const ReplyMarkup = {
  emptyKeyboard: { remove_keyboard: true } as ReplyKeyboardRemove,
  oneTime: { one_time_keyboard: true } as ReplyKeyboardMarkup,
}
