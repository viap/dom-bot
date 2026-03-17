import { getRequest } from "@/api/common/getRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { UserDto } from "@/common/dto/user.dto"
import { MyContext } from "@/common/types/myContext"

export async function getUser(
  ctx: MyContext,
  userId: string = currentUserAlias
): Promise<UserDto> {
  return getRequest<UserDto>(ctx, API_PATHS.users.one(userId))
}
