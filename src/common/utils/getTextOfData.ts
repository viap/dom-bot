import { DataStructure } from "../types/dataStructure"
import { ReplyMarkup } from "./replyMarkup"

export function getTextOfData(
  title: string,
  data: DataStructure,
  projection?: { [key: string]: string }
): string {
  const result: Array<string> = []
  const tab = "   "

  if (title) {
    result.push(`*${title.toUpperCase()}*`)
  }

  result.push(
    ...Object.entries(data).map((entry) => {
      const curProjection = projection?.[entry[0]]
      const propTitle = curProjection || entry[0]

      if (typeof entry[1] === "object") {
        return getTextOfData(
          propTitle.toString(),
          entry[1],
          typeof curProjection === "object" ? curProjection : projection
        )
          .split("\n")
          .map((line) => {
            return tab + line.trim()
          })
          .join("\r\n")
      } else {
        return `*${ReplyMarkup.escapeForParseModeV2(
          propTitle
        )}* ${ReplyMarkup.escapeForParseModeV2(`- ${entry[1]}`)}`
      }
    })
  )

  return result.join("\r\n")
}
