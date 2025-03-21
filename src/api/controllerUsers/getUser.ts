import { MyContext } from "@/common/types/myContext"
import { getRequest } from "@/api/common/getRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { UserDto } from "@/common/dto/user.dto"
import { currentUserAlias } from "@/common/consts/currentUserAlias"

export async function getUser(
  ctx: MyContext,
  userId: string = currentUserAlias
): Promise<UserDto> {
  return getRequest<UserDto>(ctx, API_PATHS.users.GET.one, { userId })
}
