import { NOTIFICATION_STATUSES } from "@/common/enums/notificationStatuses"
import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { ROLES } from "@/common/enums/roles"
import { NotificationMessageEntity } from "@/common/types/notificationMessageEntity"

export type NotificationDto = {
  _id: string

  createdAt: string
  updatedAt: string
  startsAt: string
  finishAt?: string
  title?: string
  message?: string
  messageEntities?: Array<NotificationMessageEntity>

  roles: Array<ROLES>
  recipients: Array<string>
  received: Array<string>
  // Sent by the API when the bot passes its session user ids: who may still
  // receive the notification, judged by current database roles.
  eligibleUserIds?: Array<string>
  type: NOTIFICATION_TYPES
  status: NOTIFICATION_STATUSES
}
