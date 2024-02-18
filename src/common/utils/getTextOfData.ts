import { DataStructure } from "../types/dataStructure"
import { ReplyMarkup } from "./replyMarkup"
import { notEmpty } from "./notEmpty"

export function getTextOfData(
  title: string,
  data: DataStructure,
  projection?: { [key: string]: string },
  separator = ":"
): string {
  const result: Array<string> = []
  const tab = "   "

  if (title) {
    result.push(`*${title}*`)
  }

  result.push(
    ...Object.entries(data)
      .map((entry) => {
        const curProjection = projection?.[entry[0]]
        const propTitle = curProjection || entry[0]
        const propValue = entry[1]

        if (typeof propValue === "object") {
          return getTextOfData(
            propTitle.toString(),
            propValue,
            typeof curProjection === "object" ? curProjection : projection
          )
            .split("\n")
            .map((line) => {
              return tab + line.trim()
            })
            .join("\r\n")
        } else if (propValue !== undefined) {
          return `*${ReplyMarkup.escapeForParseModeV2(
            propTitle
          )}*${ReplyMarkup.escapeForParseModeV2(`${separator} ${propValue}`)}`
        } else {
          return ""
        }
      })
      .filter(notEmpty)
  )

  return result.join("\r\n")
}
