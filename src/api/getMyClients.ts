import { MyContext } from "../types/myContext"
import { getRequest } from "./common/getRequest"
import { API_PATHS } from "./consts/apiPaths"
import { ClientDto } from "../common/dto/client.dto"

export async function getMyClients(ctx: MyContext): Promise<Array<ClientDto>> {
  return getRequest<Array<ClientDto>>(ctx, API_PATHS.psychologists.myClients)
}
