import { Bot } from "grammy"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"

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
  private static mapOptionToCalendar = new Map<string, Calendar>()

  static setBotInstance(bot: Bot<MyContext>) {
    this.bot = bot
  }

  static getCalendar(options?: CalendarOptions) {
    if (this.bot) {
      const finalOptions = {
        ...defaultOptions,
        ...options,
      }
      const optionsString = JSON.stringify(finalOptions)

      if (!this.mapOptionToCalendar.get(optionsString)) {
        this.mapOptionToCalendar.set(
          optionsString,
          new Calendar(this.bot, finalOptions)
        )
      }

      return this.mapOptionToCalendar.get(optionsString)
    }
  }
}
