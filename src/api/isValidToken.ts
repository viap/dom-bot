import { MyContext } from "../types/myContext"
import { getRequest } from "./common/getRequest"
import { API_PATHS } from "./consts/apiPaths"

export async function isValidToken(ctx: MyContext): Promise<boolean> {
  if (!ctx.session.token) return false

  return getRequest<string>(ctx, API_PATHS.users.me)
    .then((data: string) => {
      return data === "pong"
    })
    .catch(() => {
      return false
    })
}
