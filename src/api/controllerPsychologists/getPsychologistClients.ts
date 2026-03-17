import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { ClientDto } from "@/common/dto/client.dto"
import { MyContext } from "@/common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getPsychologistClients(
  ctx: MyContext,
  psychologistId: string = currentUserAlias
): Promise<Array<ClientDto>> {
  return getRequest<Array<ClientDto>>(
    ctx,
    API_PATHS.psychologists.clients(psychologistId)
  )
}
