export type PrivateSessionIdentity = {
  telegramUserId: string
  privateChatId: string
}

const CANONICAL_POSITIVE_TELEGRAM_ID = /^[1-9]\d*$/

export function parsePrivateSessionKey(
  key: string
): PrivateSessionIdentity | null {
  const segments = key.split("/")
  if (segments.length !== 2) {
    return null
  }

  const [telegramUserId, privateChatId] = segments
  if (
    !CANONICAL_POSITIVE_TELEGRAM_ID.test(telegramUserId) ||
    !CANONICAL_POSITIVE_TELEGRAM_ID.test(privateChatId) ||
    telegramUserId !== privateChatId
  ) {
    return null
  }

  return { telegramUserId, privateChatId }
}
