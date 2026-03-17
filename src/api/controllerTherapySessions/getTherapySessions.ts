import { getRequest } from "@/api/common/getRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { MyContext } from "@/common/types/myContext"

export async function getTherapySessions(
  ctx: MyContext,
  psychologistId: string = currentUserAlias,
  userId?: string,
  period?: { from: number; to: number }
): Promise<Array<TherapySessionDto>> {
  return getRequest<Array<TherapySessionDto>>(
    ctx,
    userId
      ? API_PATHS.therapySessions.forPsychologistWithClient(
          psychologistId,
          userId
        )
      : period
      ? API_PATHS.therapySessions.forPsychologistForPeriod(
          psychologistId,
          period.from,
          period.to
        )
      : API_PATHS.therapySessions.forPsychologist(psychologistId)
  )
}
