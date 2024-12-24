import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { MyContext } from "@/common/types/myContext"
import { putRequest } from "@/api/common/putRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { UpdateTherapyRequestDto } from "@/api/dto/updateTherapyRequest.dto"

export async function updateTherapyRequest(
  ctx: MyContext,
  therapyRequestId: string,
  updateData: UpdateTherapyRequestDto
): Promise<TherapyRequestDto> {
  return putRequest(
    ctx,
    API_PATHS.therapyRequests.PUT.edit,
    { therapyRequestId },
    updateData
  )
}
