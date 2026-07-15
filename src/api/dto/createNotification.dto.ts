import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { ROLES } from "@/common/enums/roles"
import { NotificationMessageEntity } from "@/common/types/notificationMessageEntity"

export type CreateNotificationDto = {
  startsAt?: string
  finishAt?: string
  roles: Array<ROLES>
  title?: string
  message: string
  messageEntities?: Array<NotificationMessageEntity>
  type: NOTIFICATION_TYPES
}
