import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getAllTherapySessions(
  ctx: MyContext,
  period?: { from: number; to: number }
): Promise<Array<TherapySessionDto>> {
  return getRequest<Array<TherapySessionDto>>(
    ctx,
    period
      ? API_PATHS.therapySessions.GET.allForPeriod
      : API_PATHS.therapySessions.GET.all,
    period ? { ...period } : undefined
  )
}
