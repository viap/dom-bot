import { getRequest } from "@/api/common/getRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { MyContext } from "@/common/types/myContext"

export async function getAllTherapySessions(
  ctx: MyContext,
  period?: { from: number; to: number }
): Promise<Array<TherapySessionDto>> {
  return getRequest<Array<TherapySessionDto>>(
    ctx,
    period
      ? API_PATHS.therapySessions.allForPeriod(period.from, period.to)
      : API_PATHS.therapySessions.all
  )
}
