import {
  ClaimedApplicationMessage,
  claimApplicationMessage,
  reportApplicationMessage,
} from "@/api/controllerApplicationMessages/applicationMessages"
import { MyContext } from "@/common/types/myContext"
import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { getOfficialApplicationMessageKeyboard } from "@/common/utils/applicationMessaging"
import { Bot, GrammyError, HttpError } from "grammy"

type Reporter = typeof reportApplicationMessage

function getPollingDelay(): number {
  const parsed = Number.parseInt(
    process.env.APPLICATION_MESSAGE_POLLING_DELAY || "5000",
    10
  )
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 5000
}

export async function deliverClaimedApplicationMessage(
  bot: Bot<MyContext>,
  message: ClaimedApplicationMessage,
  reporter: Reporter = reportApplicationMessage
): Promise<void> {
  try {
    const replyMarkup =
      message.applicationId && /^[a-f\d]{24}$/i.test(message.applicationId)
        ? getOfficialApplicationMessageKeyboard(message.applicationId)
        : undefined
    const sent = await bot.api.sendMessage(
      message.privateChatId,
      message.text,
      replyMarkup ? { reply_markup: replyMarkup } : undefined
    )
    await reporter({
      messageId: message.id,
      status: "sent",
      telegramMessageId: sent.message_id,
    })
  } catch (error) {
    const definitiveTelegramFailure = error instanceof GrammyError
    try {
      await reporter({
        messageId: message.id,
        status: definitiveTelegramFailure ? "failed" : "unknown",
        errorCode: definitiveTelegramFailure
          ? `telegram_${error.error_code}`
          : error instanceof HttpError
          ? "telegram_transport_unknown"
          : "delivery_transport_unknown",
      })
    } catch (reportError) {
      console.error(
        "[ApplicationMessageListener] delivery report failed:",
        getSafeErrorDetails(reportError)
      )
    }
  }
}

export default class ApplicationMessageListener {
  private static bot: Bot<MyContext> | undefined
  private static timer: ReturnType<typeof setTimeout> | undefined
  private static started = false
  private static running = false

  static start(bot: Bot<MyContext>): void {
    if (ApplicationMessageListener.started) return
    ApplicationMessageListener.bot = bot
    ApplicationMessageListener.started = true
    ApplicationMessageListener.schedule(0)
  }

  static stop(): void {
    ApplicationMessageListener.started = false
    ApplicationMessageListener.bot = undefined
    if (ApplicationMessageListener.timer) {
      clearTimeout(ApplicationMessageListener.timer)
      ApplicationMessageListener.timer = undefined
    }
  }

  private static schedule(delay: number): void {
    if (!ApplicationMessageListener.started) return
    ApplicationMessageListener.timer = setTimeout(
      () => void ApplicationMessageListener.runCycle(),
      delay
    )
  }

  private static async runCycle(): Promise<void> {
    if (
      !ApplicationMessageListener.started ||
      ApplicationMessageListener.running ||
      !ApplicationMessageListener.bot
    ) {
      return
    }

    ApplicationMessageListener.running = true
    try {
      const claimed = await claimApplicationMessage()
      if (claimed.enabled && claimed.message) {
        await deliverClaimedApplicationMessage(
          ApplicationMessageListener.bot,
          claimed.message
        )
      }
    } catch (error) {
      console.error(
        "[ApplicationMessageListener] poll failed:",
        getSafeErrorDetails(error)
      )
    } finally {
      ApplicationMessageListener.running = false
      ApplicationMessageListener.schedule(getPollingDelay())
    }
  }
}
