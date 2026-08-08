import { Bot } from "grammy"
import { DEFAULT_BOT_COMMANDS } from "@/common/consts/botCommands"
import { MyContext } from "@/common/types/myContext"
import NotificationListener from "@/components/NotificationListener/notificationListener"

type NotificationSessions = Parameters<typeof NotificationListener.start>[1]

export async function setDefaultBotCommands(
  bot: Bot<MyContext>
): Promise<void> {
  try {
    await bot.api.setMyCommands(DEFAULT_BOT_COMMANDS)
  } catch (error) {
    console.error("[setDefaultBotCommands] sync failed:", error)
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
    console.error("Failed to start NotificationListener:", error)
  }
}

export function stopNotificationListener(
  stopper: () => void = NotificationListener.stop
): void {
  try {
    stopper()
    console.info("NotificationListener stopped successfully")
  } catch (error) {
    console.error("Failed to stop NotificationListener:", error)
  }
}
