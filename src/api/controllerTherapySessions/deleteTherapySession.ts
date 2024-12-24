import { MyContext } from "@/common/types/myContext"
import { deleteRequest } from "@/api/common/deleteRequest"
import { API_PATHS } from "@/api/consts/apiPaths"

export async function deleteTherapySession(
  ctx: MyContext,
  therapySessionId: string
): Promise<boolean> {
  return deleteRequest(ctx, API_PATHS.therapySessions.DELETE.one, {
    therapySessionId,
  })
}
