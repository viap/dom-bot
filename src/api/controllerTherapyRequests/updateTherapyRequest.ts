import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { MyContext } from "../../common/types/myContext"
import { putRequest } from "../common/putRequest"
import { API_PATHS } from "../consts/apiPaths"
import { UpdateTherapyRequestDto } from "../dto/updateTherapyRequest.dto"

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
