import { currentUserAlias } from "../../common/consts/currentUserAlias"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { MyContext } from "../../common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { AddTherapySessionDto } from "../dto/addTherapySession.dto"

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
