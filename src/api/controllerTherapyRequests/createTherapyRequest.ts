import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { MyContext } from "../../common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { CreateTherapyRequestDto } from "../dto/createTherapyRequest.dto"

export async function createTherapyRequest(
  ctx: MyContext,
  createData: CreateTherapyRequestDto
): Promise<TherapyRequestDto> {
  return postRequest(
    ctx,
    API_PATHS.therapyRequests.POST.create,
    undefined,
    createData
  )
}
