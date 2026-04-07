import { NOTIFICATION_STATUSES } from "@/common/enums/notificationStatuses"
import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { ROLES } from "@/common/enums/roles"

export type NotificationDto = {
  _id: string

  createdAt: string
  updatedAt: string
  startsAt: number
  finishAt: number
  title?: string
  message?: string

  roles: Array<ROLES>
  recipients: Array<string>
  received: Array<string>
  type: NOTIFICATION_TYPES
  status: NOTIFICATION_STATUSES
}
