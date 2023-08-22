import { UserDto } from "../../common/dto/user.dto"
import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getAllUsers(ctx: MyContext): Promise<Array<UserDto>> {
  return getRequest<Array<UserDto>>(ctx, API_PATHS.users.GET.all)
}
