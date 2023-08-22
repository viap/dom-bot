import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { MyContext } from "../../common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { UpdateTherapyRequestDto } from "../dto/updateTherapyRequest.dto"

export async function updateTherapyRequest(
  ctx: MyContext,
  therapyRequestId: string,
  updateData: UpdateTherapyRequestDto
): Promise<TherapyRequestDto> {
  return postRequest(
    ctx,
    API_PATHS.therapyRequests.PUT.update,
    { therapyRequestId },
    updateData
  )
}
