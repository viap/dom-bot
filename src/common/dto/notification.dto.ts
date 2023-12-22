import NotificationStatuses from "../enums/notificationStatuses"
import NotificationTypes from "../enums/notificationTypes"
import { ROLES } from "../enums/roles.enum"

export type NotificationDto = {
  _id: string

  timesatamp: number
  startsAt: number
  finishAt: number

  roles: Array<ROLES>
  recipients: Array<string>
  received: Array<string>
  type: NotificationTypes
  status: NotificationStatuses
}
