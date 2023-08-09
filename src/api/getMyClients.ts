import { MyContext } from "../types/myContext"
import { getRequest } from "./common/getRequest"
import { API_PATHS } from "./consts/apiPaths"
import { UserDto } from "../common/dto/user.dto"

export async function getMyClients(
  ctx: MyContext
): Promise<Array<UserDto>> | never {
  return getRequest<Array<UserDto>>(ctx, API_PATHS.psychologists.myClients)
}
