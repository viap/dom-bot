import { apiClient } from "@/api/common/apiClient"
import { getUrl } from "@/api/common/getUrl"
import { API_PATHS } from "@/api/consts/apiPaths"

const apiClientCredentials = () => ({
  name: process.env.API_CLIENT_NAME || "",
  password: process.env.API_CLIENT_PASSWORD || "",
})

export type ClaimedApplicationMessage = {
  id: string
  applicationId?: string
  privateChatId: string
  text: string
}

export type ApplicationMessageThread = {
  applicationId: string
  formType: string
  sourceEntityType?: string
  applicantDisplayName?: string
  initialMessage?: string
  messages?: Array<{
    direction: "outbound" | "inbound"
    text: string
    senderDisplayName?: string
    createdAt: string
  }>
  createdAt: string
  lastMessageAt: string
}

export async function claimApplicationMessage(): Promise<{
  enabled: boolean
  message: ClaimedApplicationMessage | null
}> {
  const response = await apiClient.post(
    getUrl(API_PATHS.applicationMessages.claim),
    { apiClient: apiClientCredentials() },
    { timeout: 10_000 }
  )
  return response.data
}

export async function reportApplicationMessage(input: {
  messageId: string
  status: "sent" | "failed" | "unknown"
  telegramMessageId?: number
  errorCode?: string
}): Promise<void> {
  await apiClient.post(
    getUrl(API_PATHS.applicationMessages.report),
    { apiClient: apiClientCredentials(), ...input },
    { timeout: 10_000 }
  )
}

export async function receiveApplicationMessageReply(input: {
  privateChatId: string
  telegramUserId: string
  telegramMessageId: number
  replyToTelegramMessageId?: number
  applicationId?: string
  text?: string
}): Promise<{
  accepted: boolean
  stored?: boolean
  reason?: "text_required"
  applicationId?: string
}> {
  const response = await apiClient.post(
    getUrl(API_PATHS.applicationMessages.reply),
    { apiClient: apiClientCredentials(), ...input },
    { timeout: 10_000 }
  )
  return response.data
}

export async function listApplicationMessageThreads(input: {
  privateChatId: string
  telegramUserId: string
  applicationId?: string
  page?: number
}): Promise<{
  enabled: boolean
  threads: ApplicationMessageThread[]
  page: number
  hasMore: boolean
}> {
  const response = await apiClient.post(
    getUrl(API_PATHS.applicationMessages.threads),
    { apiClient: apiClientCredentials(), ...input },
    { timeout: 10_000 }
  )
  return response.data
}
