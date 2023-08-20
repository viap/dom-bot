import { MyContext } from "../common/types/myContext"
import { putRequest } from "./common/putRequest"
import { API_PATHS } from "./consts/apiPaths"
import { EditUserDto } from "./dto/editUser.dto"

export async function editUser(
  ctx: MyContext,
  userId: string,
  user: EditUserDto
): Promise<boolean> {
  return putRequest(
    ctx,
    API_PATHS.users.PUT.edit,
    { userId },
    {
      ...user,
    }
  )
}
