import { TelegramUserDto } from "@/common/dto/telegramUser.dto"
import { MyContext } from "@/common/types/myContext"
import { postRequest } from "../common/postRequest"
import { API_PATHS } from "../consts/apiPaths"
import { AuthTokenDto } from "../dto/authToken.dto"

export async function loginByTelegram(
  ctx: MyContext,
  telegramUser: TelegramUserDto
): Promise<AuthTokenDto> | never {
  if (telegramUser.is_bot) {
    throw new Error("Only real users can log in")
  }

  return postRequest<AuthTokenDto>(ctx, API_PATHS.auth.loginByTelegram, {
    apiClient: {
      name: process.env.API_CLIENT_NAME || "",
      password: process.env.API_CLIENT_PASSWORD || "",
    },
    telegram: {
      id: telegramUser.id,
      username: telegramUser.username || "",
      first_name: telegramUser.first_name || "",
      last_name: telegramUser.last_name || "",
    },
  })
}
