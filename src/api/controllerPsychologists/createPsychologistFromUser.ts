import { MyContext } from "../../common/types/myContext"
import { CreatePsychologistFromUserDto } from "../dto/createPsychologistFromUser.dto"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { PsychologistDto } from "../../common/dto/psychologist.dto"

export async function createPsychologistFromUser(
  ctx: MyContext,
  data: CreatePsychologistFromUserDto
): Promise<PsychologistDto> {
  return postRequest<PsychologistDto>(
    ctx,
    API_PATHS.psychologists.POST.create,
    undefined,
    data
  )
}
