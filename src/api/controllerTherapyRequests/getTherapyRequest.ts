import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { MyContext } from "@/common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getTherapyRequest(
  ctx: MyContext,
  therapyRequestId: string
): Promise<TherapyRequestDto> {
  return getRequest(ctx, API_PATHS.therapyRequests.GET.one, {
    therapyRequestId,
  })
}
