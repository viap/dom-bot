import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { Bot } from "grammy"
import { DEFAULT_BOT_COMMANDS } from "@/common/consts/botCommands"
import { MyContext } from "@/common/types/myContext"
import NotificationListener from "@/components/NotificationListener/notificationListener"
import ApplicationMessageListener from "@/components/ApplicationMessageListener/applicationMessageListener"

type NotificationSessions = Parameters<typeof NotificationListener.start>[1]

export async function setDefaultBotCommands(
  bot: Bot<MyContext>
): Promise<void> {
  try {
    await bot.api.setMyCommands(DEFAULT_BOT_COMMANDS)
  } catch (error) {
    console.error(
      "[setDefaultBotCommands] sync failed:",
      getSafeErrorDetails(error)
    )
  }
}

export async function startNotificationListener(
  bot: Bot<MyContext>,
  sessions: NotificationSessions,
  starter: (
    bot: Bot<MyContext>,
    sessions: NotificationSessions
  ) => Promise<void> = NotificationListener.start
): Promise<void> {
  try {
    await starter(bot, sessions)
    console.info("NotificationListener started successfully")
  } catch (error) {
    // Don't fail the entire bot if notifications fail
    console.error(
      "Failed to start NotificationListener:",
      getSafeErrorDetails(error)
    )
  }
}

export function stopNotificationListener(
  stopper: () => void = NotificationListener.stop
): void {
  try {
    stopper()
    console.info("NotificationListener stopped successfully")
  } catch (error) {
    console.error(
      "Failed to stop NotificationListener:",
      getSafeErrorDetails(error)
    )
  }
}

export function startApplicationMessageListener(
  bot: Bot<MyContext>,
  starter: (bot: Bot<MyContext>) => void = ApplicationMessageListener.start
): void {
  try {
    starter(bot)
    console.info("ApplicationMessageListener started successfully")
  } catch (error) {
    console.error(
      "Failed to start ApplicationMessageListener:",
      getSafeErrorDetails(error)
    )
  }
}

export function stopApplicationMessageListener(
  stopper: () => void = ApplicationMessageListener.stop
): void {
  try {
    stopper()
    console.info("ApplicationMessageListener stopped successfully")
  } catch (error) {
    console.error(
      "Failed to stop ApplicationMessageListener:",
      getSafeErrorDetails(error)
    )
  }
}
