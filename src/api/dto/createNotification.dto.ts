import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { ROLES } from "@/common/enums/roles"

export type CreateNotificationDto = {
  startsAt?: string
  finishAt?: string
  roles: Array<ROLES>
  title?: string
  message: string
  type: NOTIFICATION_TYPES
}
