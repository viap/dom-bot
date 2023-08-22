import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { currentUserAlias } from "../../common/consts/currentUserAlias"

export async function getTherapySessions(
  ctx: MyContext,
  userId?: string,
  psychologistId: string = currentUserAlias
): Promise<Array<TherapySessionDto>> {
  return getRequest<Array<TherapySessionDto>>(
    ctx,
    userId
      ? API_PATHS.therapySessions.GET.forPsychologistWithClient
      : API_PATHS.therapySessions.GET.forPsychologist,
    userId
      ? {
          userId,
          psychologistId,
        }
      : { psychologistId }
  )
}
