import { MyContext } from "../types/myContext"
import { getRequest } from "./common/getRequest"
import { API_PATHS } from "./consts/apiPaths"
import { PsychologistDto } from "../common/dto/psychologist.dto"

export async function getMePsychologist(
  ctx: MyContext
): Promise<PsychologistDto> | never {
  return getRequest<PsychologistDto>(ctx, API_PATHS.psychologists.me)
}
