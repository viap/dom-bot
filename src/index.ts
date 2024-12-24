import { run } from "@grammyjs/runner"
import domBot from "./domBot"

const runner = run(domBot)
if (runner.isRunning()) {
  console.info("Bot was started")
} else {
  console.error("Something went wrong on bot starting")
}
