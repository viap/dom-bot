import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { sequentialize } from "@grammyjs/runner"
import {
  Composer,
  Context,
  MemorySessionStorage,
  SessionFlavor,
  session,
} from "grammy"
import { getSessionKey } from "@/createDomBot"
import {
  createUpdateWatchdog,
  skipSessionWriteIfReleased,
} from "@/common/middlewares/updateWatchdog"
import { messageUpdate } from "../helpers/telegram"

type TestContext = Context & SessionFlavor<{ last?: string }>

function makeCtx(text: string, updateId: number): TestContext {
  return new Context(
    messageUpdate(text, { updateId }),
    {} as never,
    {} as never
  ) as TestContext
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The watchdog timer is unref()'d; in production long polling keeps the event
// loop alive, here an interval does.
async function withEventLoop<T>(run: () => Promise<T>): Promise<T> {
  const keepAlive = setInterval(() => undefined, 10)
  const originalError = console.error
  try {
    return await run()
  } finally {
    clearInterval(keepAlive)
    console.error = originalError
  }
}

describe("update watchdog", () => {
  it("releases a user's queue when an update never settles", async () => {
    const handled: Array<string> = []
    const composer = new Composer<TestContext>()
    composer.use(sequentialize(getSessionKey))
    composer.use(createUpdateWatchdog(150))
    composer.on("message:text", async (ctx) => {
      if (ctx.message.text === "hang") await new Promise(() => {})
      handled.push(ctx.message.text)
    })
    const run = (ctx: TestContext) =>
      composer.middleware()(ctx, async () => undefined)

    await withEventLoop(async () => {
      console.error = () => undefined
      const stuck = run(makeCtx("hang", 1))
      await run(makeCtx("next", 2))
      await stuck
    })

    assert.deepEqual(handled, ["next"])
  })

  it("propagates errors thrown before the deadline", async () => {
    const watchdog = createUpdateWatchdog(1000)

    await assert.rejects(
      watchdog(makeCtx("boom", 1), async () => {
        throw new Error("boom")
      }),
      /boom/
    )
  })

  it("never saves the session of an update that finishes after release", async () => {
    const storage = new MemorySessionStorage<{ last?: string }>()
    const composer = new Composer<TestContext>()
    composer.use(sequentialize(getSessionKey))
    composer.use(createUpdateWatchdog(150))
    composer.use(session({ initial: () => ({}), getSessionKey, storage }))
    composer.use(skipSessionWriteIfReleased)
    composer.on("message:text", async (ctx) => {
      ctx.session.last = ctx.message.text
      if (ctx.message.text === "slow") await delay(400)
    })
    const run = (ctx: TestContext) =>
      composer.middleware()(ctx, async () => undefined)
    const logs: Array<string> = []
    const originalWarn = console.warn

    await withEventLoop(async () => {
      console.error = (...args: Array<unknown>) => {
        logs.push(`error ${String(args[0])}`)
      }
      console.warn = (...args: Array<unknown>) => {
        logs.push(`warn ${String(args[0])}`)
      }
      await run(makeCtx("slow", 1))
      await run(makeCtx("next", 2))
      await delay(600)
    }).finally(() => {
      console.warn = originalWarn
    })

    assert.deepEqual(storage.read("101/201"), { last: "next" })
    assert.deepEqual(logs, [
      "error [updateWatchdog] update released after timeout:",
      "warn [updateWatchdog] released update finished late, session not saved:",
    ])
  })
})
