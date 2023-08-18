import { currentUserAlias } from "../common/consts/currentUserAlias"
import { MyContext } from "../common/types/myContext"
import { putRequest } from "./common/putRequest"
import { API_PATHS } from "./consts/apiPaths"
import { EditClientDto } from "./dto/editClient.dto"

export async function editClient(
  ctx: MyContext,
  userId: string,
  client: EditClientDto,
  psychologistId: string = currentUserAlias
): Promise<boolean> {
  return putRequest(
    ctx,
    API_PATHS.psychologists.PUT.editClient,
    { psychologistId, userId },
    {
      ...client,
    }
  )
}
