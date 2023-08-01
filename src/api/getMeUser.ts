import { MyContext } from "../types/myContext"
import { getRequest } from "./common/getRequest"
import { API_PATHS } from "./consts/apiPaths"
import { UserDto } from "./dto/user.dto"

export async function getMeUser(ctx: MyContext): Promise<UserDto> | never {
  return getRequest<UserDto>(ctx, API_PATHS.users.me)
}
