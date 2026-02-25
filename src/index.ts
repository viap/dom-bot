import { run } from "@grammyjs/runner"
import domBot from "./domBot"

async function startBot() {
  try {
    // Remove previous webhook, if any. (This is optional, but recommended)
    console.info("Cleaning up webhook...")
    await domBot.api.deleteWebhook()

    // Start the bot runner
    console.info("Starting bot runner...")
    const runner = run(domBot)

    // Wait for runner to actually start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Bot startup timeout"))
      }, 10000) // 10 second timeout

      const checkRunning = () => {
        if (runner.isRunning()) {
          clearTimeout(timeout)
          console.info("Bot was started successfully")
          resolve(runner)
        } else {
          setTimeout(checkRunning, 100)
        }
      }
      checkRunning()
    })

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.info(`Received ${signal}. Shutting down gracefully...`)
      try {
        if (runner.isRunning()) {
          await runner.stop()
          console.info("Bot runner stopped")
        }
        process.exit(0)
      } catch (error) {
        console.error("Error during shutdown:", error)
        process.exit(1)
      }
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))

    return runner
  } catch (error) {
    console.error("Failed to start bot:", error)
    process.exit(1)
  }
}

// Start the bot
startBot().catch((error) => {
  console.error("Bot startup failed:", error)
  process.exit(1)
})
