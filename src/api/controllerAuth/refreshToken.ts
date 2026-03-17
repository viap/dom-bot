import { MyContext } from "@/common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { AuthTokenDto } from "../dto/authToken.dto"

export async function refreshToken(
  ctx: MyContext
): Promise<AuthTokenDto> | never {
  if (!ctx.session.token) {
    throw new Error("Refresh token is possible only with existed one")
  }

  return postRequest<AuthTokenDto>(ctx, API_PATHS.auth.POST.refreshToken).then(
    (data: AuthTokenDto) => {
      // NOTICE: save token into session
      ctx.session.token = data.auth_token
      return data
    }
  )
}
