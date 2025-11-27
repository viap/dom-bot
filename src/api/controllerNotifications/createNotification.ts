import { NotificationDto } from "@/common/dto/notification.dto"
import { MyContext } from "@/common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { CreateNotificationDto } from "../dto/createNotification.dto"

export async function createNotification(
  ctx: MyContext,
  createData: CreateNotificationDto
): Promise<NotificationDto | false> {
  return postRequest(
    ctx,
    API_PATHS.notifications.POST.create,
    undefined,
    createData
  )
}
