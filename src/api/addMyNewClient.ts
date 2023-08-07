import { MyContext } from "../types/myContext"
import { postRequest } from "./common/postRequest"
import { API_PATHS } from "./consts/apiPaths"

export async function addMyNewClient(
  ctx: MyContext,
  user: { name: string; descr: string }
): Promise<boolean> {
  return postRequest(ctx, API_PATHS.psychologists.addMyNewClient, undefined, {
    ...user,
  })
}
