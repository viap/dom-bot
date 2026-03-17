import { deleteRequest } from "@/api/common/deleteRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { MyContext } from "@/common/types/myContext"

export async function deleteTherapySession(
  ctx: MyContext,
  therapySessionId: string
): Promise<boolean> {
  return deleteRequest(ctx, API_PATHS.therapySessions.one(therapySessionId))
}
