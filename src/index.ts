import { run } from "@grammyjs/runner"
import domBot from "./domBot"

// Remove previous webhook, if any. (This is optional, but recommended)
await domBot.api.deleteWebhook()

const runner = run(domBot)
if (runner.isRunning()) {
  console.info("Bot was started")
} else {
  console.error("Something went wrong on bot starting")
}
