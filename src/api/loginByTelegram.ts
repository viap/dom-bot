import { MyContext } from "../types/myContext"
import { postRequest } from "./common/postRequest"
import { API_PATHS } from "./consts/apiPaths"
import { LoginByTelegramDto } from "./dto/loginByTelegram.dto"
import { TelegramUserDto } from "../common/dto/telegramUser.dto"

export async function loginByTelegram(
  ctx: MyContext,
  telegramUser: TelegramUserDto
): Promise<LoginByTelegramDto> | never {
  if (telegramUser.is_bot) {
    throw new Error("Only real users can log in")
  }

  return postRequest<LoginByTelegramDto>(
    ctx,
    API_PATHS.auth.loginByTelegram,
    undefined,
    {
      apiClient: {
        name: process.env.API_CLIENT_NAME || "",
        password: process.env.API_PASSWORD || "",
      },
      telegram: {
        id: telegramUser.id,
        username: telegramUser.username || "",
        first_name: telegramUser.first_name || "",
        last_name: telegramUser.last_name || "",
      },
    }
  ).then((data: LoginByTelegramDto) => {
    // NOTICE: save token into session
    ctx.session.token = data.auth_token
    return data
  })
}
