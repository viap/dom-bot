import { NotificationDto } from "@/common/dto/notification.dto"
import { getLocalDateString } from "@/common/utils/getLocalDateString"
import { getTextOfData } from "@/common/utils/getTextOfData"

export function getTextOfNotification(
  notification: NotificationDto,
  title = "",
  separator?: string
): string {
  return getTextOfData(
    title,
    {
      title: notification.title,
      message: notification.message,
      startsAt: getLocalDateString(notification.startsAt),
      finishAt: getLocalDateString(notification.finishAt),
      roles: notification.roles.join(", "),
      recipients: notification.recipients.join(", "),
      status: notification.status,
      type: notification.type,
    },
    {
      title: "заголовок",
      message: "сообщение",
      startsAt: "начало",
      finishAt: "окончание",
      roles: "роли",
      recipients: "получатели",
      status: "статус",
      type: "тип",
    },
    separator
  )
}
