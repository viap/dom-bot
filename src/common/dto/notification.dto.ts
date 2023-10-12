import NotificationStatuses from "../enums/notificationStatuses"
import NotificationTypes from "../enums/notificationTypes"
import { ROLES } from "../enums/roles.enum"
import { UserDto } from "./user.dto"

export type NotificationDto = {
  _id: string

  timesatamp: number
  startsAt: number
  finishAt: number

  roles: Array<ROLES>
  recipients: Array<UserDto>
  received: Array<UserDto>
  type: NotificationTypes
  status: NotificationStatuses
}
