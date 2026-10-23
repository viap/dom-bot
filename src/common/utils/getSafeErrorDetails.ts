import { isAxiosError } from "axios"
import { GrammyError } from "grammy"

const BOT_TOKEN_PATTERN = /bot\d+:[\w-]+/g

// Error details that are safe to log: never the request payload (API client
// password, Telegram message text, chat ids), headers (JWT) or bot token.
export function getSafeErrorDetails(error: unknown): {
  message: string
  status?: number
  url?: string
  method?: string
} {
  if (isAxiosError(error)) {
    return {
      message: stripBotToken(error.message),
      status: error.response?.status,
      url: error.config?.url,
    }
  }

  if (error instanceof GrammyError) {
    return {
      message: stripBotToken(error.description),
      status: error.error_code,
      method: error.method,
    }
  }

  return {
    message:
      error instanceof Error ? stripBotToken(error.message) : "Unknown error",
  }
}

function stripBotToken(value: string): string {
  return value.replace(BOT_TOKEN_PATTERN, "bot***")
}
