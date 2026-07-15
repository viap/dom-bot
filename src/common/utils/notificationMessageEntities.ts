import type { MessageEntity } from "@grammyjs/types"
import { NotificationMessageEntity } from "@/common/types/notificationMessageEntity"
import { isValidLinkUrl } from "./isValidLinkUrl"

function hasValidRange(entity: MessageEntity, message: string): boolean {
  return (
    Number.isInteger(entity.offset) &&
    Number.isInteger(entity.length) &&
    entity.offset >= 0 &&
    entity.length > 0 &&
    entity.offset + entity.length <= message.length
  )
}

export function sanitizeNotificationMessageEntities(
  message = "",
  entities: Array<MessageEntity | NotificationMessageEntity> = []
): Array<NotificationMessageEntity> {
  return entities.reduce<Array<NotificationMessageEntity>>((result, entity) => {
    if (!hasValidRange(entity, message)) {
      return result
    }

    if (entity.type === "text_link" && isValidLinkUrl(entity.url)) {
      result.push({
        type: "text_link",
        offset: entity.offset,
        length: entity.length,
        url: entity.url,
      })
    }

    if (entity.type === "url") {
      const url = message.slice(entity.offset, entity.offset + entity.length)
      if (isValidLinkUrl(url)) {
        result.push({
          type: "url",
          offset: entity.offset,
          length: entity.length,
        })
      }
    }

    return result
  }, [])
}

export function offsetNotificationMessageEntities(
  entities: Array<NotificationMessageEntity>,
  offset: number
): Array<NotificationMessageEntity> {
  return entities.map((entity) => ({
    ...entity,
    offset: entity.offset + offset,
  }))
}
