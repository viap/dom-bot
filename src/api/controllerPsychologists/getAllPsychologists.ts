import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { MyContext } from "@/common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getAllPsychologists(
  ctx: MyContext
): Promise<Array<PsychologistDto>> {
  return getRequest<Array<PsychologistDto>>(
    ctx,
    API_PATHS.psychologists.GET.all
  )
}
