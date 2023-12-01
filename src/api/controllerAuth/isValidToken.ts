import { MyContext } from "../../common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function hasValidToken(ctx: MyContext): Promise<boolean> {
  if (!ctx.session.token) return false

  return getRequest<boolean>(ctx, API_PATHS.auth.GET.checkToken).catch(() => {
    return false
  })
}
