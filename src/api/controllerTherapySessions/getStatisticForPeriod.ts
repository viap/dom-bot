import { TherapySessionsStatisticDto } from "../../common/dto/therapySessionsStatistic.dto"
import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getStatisticForPeriod(
  ctx: MyContext,
  period: { from: number; to: number },
  psychologistId?: string
): Promise<Array<TherapySessionsStatisticDto>> {
  return getRequest<Array<TherapySessionsStatisticDto>>(
    ctx,
    psychologistId
      ? API_PATHS.therapySessions.GET.statisticForPsychologistForPeriod
      : API_PATHS.therapySessions.GET.statisticForPeriod,
    { ...period, psychologistId }
  )
}
