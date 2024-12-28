import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { Bot } from "grammy"

import { Calendar, CalendarOptions } from "telegram-inline-calendar"
const defaultOptions: CalendarOptions = {
  language: "ru",
  bot_api: "grammy",
  custom_start_msg: false,
  time_selector_mod: false,
  date_format: ReplyMarkup.patterns.dateRu,
}

export class DatePicker {
  private static bot: Bot<MyContext>

  static setBotInstance(bot: Bot<MyContext>) {
    this.bot = bot
  }

  static getCalendar(options?: CalendarOptions) {
    if (this.bot) {
      const finalOptions = {
        ...defaultOptions,
        ...options,
      }

      return new Calendar(this.bot, finalOptions)
    } else {
      throw new Error("Bot does not exist")
    }
  }
}
