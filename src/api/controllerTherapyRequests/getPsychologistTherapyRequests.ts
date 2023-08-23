import { currentUserAlias } from "../../common/consts/currentUserAlias"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getPsychologistTherapyRequests(
  ctx: MyContext,
  psychologistId: string = currentUserAlias
): Promise<Array<TherapyRequestDto>> {
  return getRequest(ctx, API_PATHS.therapyRequests.GET.forPsychologist, {
    psychologistId,
  })
}
