import { putRequest } from "@/api/common/putRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { UpdateTherapyRequestDto } from "@/api/dto/updateTherapyRequest.dto"
import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { MyContext } from "@/common/types/myContext"

export async function updateTherapyRequest(
  ctx: MyContext,
  therapyRequestId: string,
  updateData: UpdateTherapyRequestDto
): Promise<TherapyRequestDto> {
  return putRequest(
    ctx,
    API_PATHS.therapyRequests.edit(therapyRequestId),
    updateData
  )
}
