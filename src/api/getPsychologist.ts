import { MyContext } from "../common/types/myContext"
import { getRequest } from "./common/getRequest"
import { API_PATHS } from "./consts/apiPaths"
import { PsychologistDto } from "../common/dto/psychologist.dto"
import { currentUserAlias } from "../common/consts/currentUserAlias"

export async function getPsychologist(
  ctx: MyContext,
  psychologistId: string = currentUserAlias
): Promise<PsychologistDto> | never {
  return getRequest<PsychologistDto>(ctx, API_PATHS.psychologists.GET.one, {
    psychologistId,
  })
}
