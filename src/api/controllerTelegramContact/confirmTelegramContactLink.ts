import { apiClient } from "@/api/common/apiClient"
import { getUrl } from "@/api/common/getUrl"
import { API_PATHS } from "@/api/consts/apiPaths"
import { TelegramUserDto } from "@/common/dto/telegramUser.dto"

export type ConfirmTelegramContactLinkResult = {
  status: "linked" | "already_linked" | "cancelled" | "in_progress"
}

export async function confirmTelegramContactLink(
  startToken: string,
  privateChatId: string,
  telegramUser: TelegramUserDto
): Promise<ConfirmTelegramContactLinkResult> {
  const response = await apiClient.post<ConfirmTelegramContactLinkResult>(
    getUrl(API_PATHS.telegramContact.confirmLink),
    {
      apiClient: {
        name: process.env.API_CLIENT_NAME || "",
        password: process.env.API_CLIENT_PASSWORD || "",
      },
      startToken,
      privateChatId,
      telegram: {
        id: String(telegramUser.id),
        username: telegramUser.username || "",
        first_name: telegramUser.first_name || "",
        last_name: telegramUser.last_name || "",
      },
    },
    { timeout: 10_000 }
  )

  return response.data
}

export async function cancelTelegramContactLink(
  startToken: string
): Promise<{ status: "cancelled" }> {
  const response = await apiClient.post<{ status: "cancelled" }>(
    getUrl(API_PATHS.telegramContact.cancelLink),
    {
      apiClient: {
        name: process.env.API_CLIENT_NAME || "",
        password: process.env.API_CLIENT_PASSWORD || "",
      },
      startToken,
    },
    { timeout: 10_000 }
  )
  return response.data
}
