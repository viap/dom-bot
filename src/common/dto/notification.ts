import { NOTIFICATION_STATUSES } from "../enums/notificationStatuses"
import { NOTIFICATION_TYPES } from "../enums/notificationTypes"
import { ROLES } from "../enums/roles"

export type NotificationDto = {
  _id: string

  timesatamp: number
  startsAt: number
  finishAt: number

  roles: Array<ROLES>
  recipients: Array<string>
  received: Array<string>
  type: NOTIFICATION_TYPES
  status: NOTIFICATION_STATUSES
}
