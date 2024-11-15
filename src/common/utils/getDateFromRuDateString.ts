import { ReplyMarkup } from "./replyMarkup"

export function getDateFromRuDateString(dateStr: string) {
  const dateParts = ReplyMarkup.regExp.dateRu.exec(dateStr)

  if (dateParts) {
    return new Date(`${dateParts[2]}.${dateParts[1]}.${dateParts[3]}`)
  }
  return new Date()
}
