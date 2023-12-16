import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { currentUserAlias } from "../../common/consts/currentUserAlias"

export async function getTherapySessions(
  ctx: MyContext,
  psychologistId: string = currentUserAlias,
  userId?: string,
  period?: { from: number; to: number }
): Promise<Array<TherapySessionDto>> {
  return getRequest<Array<TherapySessionDto>>(
    ctx,
    userId
      ? API_PATHS.therapySessions.GET.forPsychologistWithClient
      : period
      ? API_PATHS.therapySessions.GET.forPsychologistForPeriod
      : API_PATHS.therapySessions.GET.forPsychologist,
    userId
      ? {
          userId,
          psychologistId,
        }
      : period
      ? { psychologistId, ...period }
      : { psychologistId }
  )
}
