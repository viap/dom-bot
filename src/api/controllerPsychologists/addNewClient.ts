import { currentUserAlias } from "../../common/consts/currentUserAlias"
import { MyContext } from "../../common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { AddNewClientDto } from "../dto/addNewClient.dto"

export async function addNewClient(
  ctx: MyContext,
  user: AddNewClientDto,
  psychologistId: string = currentUserAlias
): Promise<boolean> {
  return postRequest(
    ctx,
    API_PATHS.psychologists.POST.newClient,
    { psychologistId },
    {
      ...user,
    }
  )
}
