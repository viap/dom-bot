import {
  ClaimedApplicationMessage,
  claimApplicationMessage,
  reportApplicationMessage,
} from "@/api/controllerApplicationMessages/applicationMessages"
import { MyContext } from "@/common/types/myContext"
import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { getOfficialApplicationMessageKeyboard } from "@/common/utils/applicationMessaging"
import { isAxiosError } from "axios"
import { Bot, GrammyError, HttpError } from "grammy"

type Reporter = typeof reportApplicationMessage
type DeliveryReport = Parameters<Reporter>[0]
type Claimer = typeof claimApplicationMessage
type Deliverer = (
  bot: Bot<MyContext>,
  message: ClaimedApplicationMessage,
  reporter: Reporter
) => Promise<DeliveryReport | undefined>
const DRAIN_POLLING_DELAY = 1_000
const MAX_FAILURE_POLLING_DELAY = 60_000
const SENT_REPORT_DELAYS = [0, 250, 1_000]
const PERMANENT_REPORT_HTTP_STATUSES = new Set([400, 404, 409, 410, 422])

export type ApplicationMessageCycleState = {
  pendingReport?: DeliveryReport
  consecutiveFailures: number
}

export type ApplicationMessageCycleResult = ApplicationMessageCycleState & {
  nextDelay: number
}

export type ApplicationMessageCycleDependencies = {
  claim: Claimer
  report: Reporter
  deliver: Deliverer
  pollingDelay: number
}

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
  reporter: Reporter = reportApplicationMessage,
  wait: (delay: number) => Promise<void> = (delay) =>
    new Promise((resolve) => setTimeout(resolve, delay))
): Promise<DeliveryReport | undefined> {
  let sent: { message_id: number }
  try {
    const replyMarkup =
      message.applicationId && /^[a-f\d]{24}$/i.test(message.applicationId)
        ? getOfficialApplicationMessageKeyboard(message.applicationId)
        : undefined
    sent = await bot.api.sendMessage(
      message.privateChatId,
      message.text,
      replyMarkup ? { reply_markup: replyMarkup } : undefined
    )
  } catch (error) {
    const definitiveTelegramFailure =
      error instanceof GrammyError &&
      error.error_code >= 400 &&
      error.error_code < 500
    const report: DeliveryReport = {
      messageId: message.id,
      status: definitiveTelegramFailure ? "failed" : "unknown",
      errorCode: definitiveTelegramFailure
        ? `telegram_${error.error_code}`
        : error instanceof HttpError
        ? "telegram_transport_unknown"
        : "delivery_transport_unknown",
    }
    return reportWithRetries(report, reporter, wait)
  }

  return reportWithRetries(
    {
      messageId: message.id,
      status: "sent",
      telegramMessageId: sent.message_id,
    },
    reporter,
    wait
  )
}

async function reportWithRetries(
  report: DeliveryReport,
  reporter: Reporter,
  wait: (delay: number) => Promise<void>
): Promise<DeliveryReport | undefined> {
  for (let attempt = 0; attempt < SENT_REPORT_DELAYS.length; attempt += 1) {
    try {
      if (SENT_REPORT_DELAYS[attempt] > 0) {
        await wait(SENT_REPORT_DELAYS[attempt])
      }
      await flushApplicationMessageReport(report, reporter)
      return undefined
    } catch (error) {
      if (attempt === SENT_REPORT_DELAYS.length - 1) {
        console.error(
          "[ApplicationMessageListener] delivery report queued:",
          getSafeErrorDetails(error)
        )
      }
    }
  }
  return report
}

export async function flushApplicationMessageReport(
  report: DeliveryReport,
  reporter: Reporter = reportApplicationMessage
): Promise<DeliveryReport | undefined> {
  try {
    await reporter(report)
    return undefined
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    if (status !== undefined && PERMANENT_REPORT_HTTP_STATUSES.has(status)) {
      console.error(
        "[ApplicationMessageListener] delivery report rejected permanently:",
        {
          httpStatus: status,
          messageId: report.messageId,
          status: report.status,
        }
      )
      return undefined
    }
    throw error
  }
}

export async function runApplicationMessageCycle(
  bot: Bot<MyContext>,
  state: ApplicationMessageCycleState,
  dependencies: ApplicationMessageCycleDependencies = {
    claim: claimApplicationMessage,
    report: reportApplicationMessage,
    deliver: deliverClaimedApplicationMessage,
    pollingDelay: getPollingDelay(),
  }
): Promise<ApplicationMessageCycleResult> {
  try {
    if (state.pendingReport) {
      const pendingReport = await flushApplicationMessageReport(
        state.pendingReport,
        dependencies.report
      )
      return {
        pendingReport,
        consecutiveFailures: 0,
        nextDelay: DRAIN_POLLING_DELAY,
      }
    }

    const claimed = await dependencies.claim()
    if (claimed.enabled && claimed.message) {
      const pendingReport = await dependencies.deliver(
        bot,
        claimed.message,
        dependencies.report
      )
      return {
        pendingReport,
        consecutiveFailures: 0,
        nextDelay: pendingReport
          ? dependencies.pollingDelay
          : DRAIN_POLLING_DELAY,
      }
    }

    return {
      pendingReport: undefined,
      consecutiveFailures: 0,
      nextDelay: dependencies.pollingDelay,
    }
  } catch (error) {
    const consecutiveFailures = state.consecutiveFailures + 1
    console.error(
      "[ApplicationMessageListener] poll failed:",
      getSafeErrorDetails(error)
    )
    return {
      pendingReport: state.pendingReport,
      consecutiveFailures,
      nextDelay: Math.min(
        dependencies.pollingDelay * 2 ** (consecutiveFailures - 1),
        MAX_FAILURE_POLLING_DELAY
      ),
    }
  }
}

export default class ApplicationMessageListener {
  private static bot: Bot<MyContext> | undefined
  private static timer: ReturnType<typeof setTimeout> | undefined
  private static started = false
  private static running = false
  private static consecutiveFailures = 0
  private static pendingReport: DeliveryReport | undefined

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
    let nextDelay = getPollingDelay()
    try {
      const result = await runApplicationMessageCycle(
        ApplicationMessageListener.bot,
        {
          pendingReport: ApplicationMessageListener.pendingReport,
          consecutiveFailures: ApplicationMessageListener.consecutiveFailures,
        }
      )
      ApplicationMessageListener.pendingReport = result.pendingReport
      ApplicationMessageListener.consecutiveFailures =
        result.consecutiveFailures
      nextDelay = result.nextDelay
    } finally {
      ApplicationMessageListener.running = false
      ApplicationMessageListener.schedule(nextDelay)
    }
  }
}
