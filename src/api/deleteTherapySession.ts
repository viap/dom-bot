import { MyContext } from "../common/types/myContext"
import { deleteRequest } from "./common/deleteRequest"
import { API_PATHS } from "./consts/apiPaths"

export async function deleteTherapySession(
  ctx: MyContext,
  therapySessionId: string
): Promise<boolean> {
  return deleteRequest(ctx, API_PATHS.therapySessions.DELETE.one, {
    therapySessionId,
  })
}
