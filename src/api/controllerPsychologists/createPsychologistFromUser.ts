import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { MyContext } from "@/common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { CreatePsychologistFromUserDto } from "../dto/createPsychologistFromUser.dto"

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
