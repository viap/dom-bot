import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { MyContext } from "@/common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getPsychologist(
  ctx: MyContext,
  psychologistId: string = currentUserAlias
): Promise<PsychologistDto> {
  return getRequest<PsychologistDto>(
    ctx,
    API_PATHS.psychologists.one(psychologistId)
  )
}
