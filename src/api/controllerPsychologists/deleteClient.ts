import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { MyContext } from "@/common/types/myContext"
import { deleteRequest } from "../common/deleteRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function deleteClient(
  ctx: MyContext,
  userId: string,
  psychologistId: string = currentUserAlias
): Promise<boolean> {
  return deleteRequest(
    ctx,
    API_PATHS.psychologists.deleteClient(psychologistId, userId)
  )
}
