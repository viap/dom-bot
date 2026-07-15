import { NotificationMessageEntity } from "@/common/types/notificationMessageEntity"
import { isValidLinkUrl } from "./isValidLinkUrl"

export type ParsedNotificationMessage = {
  text: string
  entities: Array<NotificationMessageEntity>
}

export function parseNotificationMessageLinks(
  message = ""
): ParsedNotificationMessage {
  const entities: Array<NotificationMessageEntity> = []
  let text = ""
  let index = 0

  while (index < message.length) {
    const linkStart = message.indexOf("[", index)

    if (linkStart === -1) {
      text += message.slice(index)
      break
    }

    text += message.slice(index, linkStart)

    const labelEnd = message.indexOf("]", linkStart + 1)
    if (labelEnd === -1) {
      text += message.slice(linkStart)
      break
    }

    const label = message.slice(linkStart + 1, labelEnd)
    if (!label || /[\r\n]/.test(label) || message[labelEnd + 1] !== "(") {
      text += message[linkStart]
      index = linkStart + 1
      continue
    }

    const urlStart = labelEnd + 2
    let urlEnd = -1
    let parenDepth = 0

    for (let urlIndex = urlStart; urlIndex < message.length; urlIndex++) {
      const char = message[urlIndex]
      if (char === "(") {
        parenDepth++
      } else if (char === ")") {
        if (parenDepth === 0) {
          urlEnd = urlIndex
          break
        }
        parenDepth--
      }
    }

    if (urlEnd === -1) {
      text += message.slice(linkStart)
      break
    }

    const source = message.slice(linkStart, urlEnd + 1)
    const url = message.slice(urlStart, urlEnd)

    if (url && !/\s/.test(url) && isValidLinkUrl(url)) {
      const offset = text.length
      text += label
      entities.push({
        type: "text_link",
        offset,
        length: label.length,
        url,
      })
    } else {
      text += source
    }

    index = urlEnd + 1
  }

  return { text, entities }
}
