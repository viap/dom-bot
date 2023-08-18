import { MyContext } from "../common/types/myContext"
import { deleteRequest } from "./common/deleteRequest"
import { API_PATHS } from "./consts/apiPaths"

export async function deleteClient(
  ctx: MyContext,
  psychologistId: string,
  userId: string
): Promise<boolean> {
  return deleteRequest(ctx, API_PATHS.psychologists.DELETE.client, {
    psychologistId,
    userId,
  })
}
