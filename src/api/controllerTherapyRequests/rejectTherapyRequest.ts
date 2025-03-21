import { MyContext } from "@/common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function rejectTherapyRequest(
  ctx: MyContext,
  therapyRequestId: string
): Promise<boolean> {
  return postRequest(ctx, API_PATHS.therapyRequests.POST.reject, {
    therapyRequestId,
  })
}
