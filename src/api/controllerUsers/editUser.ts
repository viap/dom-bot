import { putRequest } from "@/api/common/putRequest"
import { API_PATHS } from "@/api/consts/apiPaths"
import { EditUserDto } from "@/api/dto/editUser.dto"
import { MyContext } from "@/common/types/myContext"

export async function editUser(
  ctx: MyContext,
  userId: string,
  user: EditUserDto
): Promise<EditUserDto> {
  return putRequest(ctx, API_PATHS.users.edit(userId), {
    ...user,
  })
}
