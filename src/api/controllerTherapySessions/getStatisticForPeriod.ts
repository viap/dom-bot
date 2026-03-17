import { getRequest } from "@/api/common/getRequest";
import { API_PATHS } from "@/api/consts/apiPaths";
import { TherapySessionsStatisticDto } from "@/common/dto/therapySessionsStatistic.dto";
import { MyContext } from "@/common/types/myContext";

export async function getStatisticForPeriod(
  ctx: MyContext,
  period: { from: number; to: number },
  psychologistId?: string
): Promise<Array<TherapySessionsStatisticDto>> {
  return getRequest<Array<TherapySessionsStatisticDto>>(
    ctx,
    psychologistId
      ? API_PATHS.therapySessions.statisticForPsychologistForPeriod(
          psychologistId,
          period.from,
          period.to
        )
      : API_PATHS.therapySessions.statisticForPeriod(period.from, period.to)
  )
}
