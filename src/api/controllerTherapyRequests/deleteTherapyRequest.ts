import { MyContext } from "../../common/types/myContext"
import { deleteRequest } from "../common/deleteRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function deleteTherapyRequest(
  ctx: MyContext,
  therapyRequestId: string
): Promise<boolean> {
  return deleteRequest(ctx, API_PATHS.therapyRequests.DELETE.one, {
    therapyRequestId,
  })
}
