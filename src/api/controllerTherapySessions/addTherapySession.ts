import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { MyContext } from "@/common/types/myContext"
import { postRequest } from "@/api/common/postRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { AddTherapySessionDto } from "@/api/dto/addTherapySession.dto"

export async function addTherapySession(
  ctx: MyContext,
  therapySession: AddTherapySessionDto,
  psychologistId: string = currentUserAlias
): Promise<TherapySessionDto> {
  return postRequest(
    ctx,
    API_PATHS.therapySessions.POST.createForPsychologist,
    { psychologistId },
    therapySession
  )
}
