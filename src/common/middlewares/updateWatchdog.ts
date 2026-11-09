import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { getSessionKey } from "@/common/utils/getSessionKey"
import { Context, NextFunction } from "grammy"

export const UPDATE_WATCHDOG_MS = 5 * 60 * 1000

const releasedUpdates = new WeakSet<Context>()
// ponytail: in-memory and per process, lost on restart (a stuck log then hangs
// once more and gets released again). Known limits: an update that never
// settles keeps its context in memory until restart, and a hang inside the
// session write itself (Mongo) is not covered by skipSessionWriteIfReleased.
const releasedSessionKeys = new Set<string>()

class ReleasedUpdateError extends Error {
  constructor() {
    super("Update finished after the watchdog released it")
  }
}

// sequentialize() holds a user's update queue until their current update
// settles. A handler that never settles (e.g. a diverged conversation replay)
// would silence the bot for that user until a restart. After a generous
// deadline stop waiting so later updates run, and log which update got stuck.
// The released update can never save its session (see
// skipSessionWriteIfReleased), and the next update of that user exits the
// stuck conversation (see consumeReleasedSessionKey).
export function createUpdateWatchdog(timeoutMs = UPDATE_WATCHDOG_MS) {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const task = next()
    let timer: NodeJS.Timeout | undefined
    const timedOut = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), timeoutMs)
      timer.unref()
    })

    try {
      if ((await Promise.race([task, timedOut])) !== "timeout") return

      releasedUpdates.add(ctx)
      const key = getSessionKey(ctx)
      if (key) releasedSessionKeys.add(key)

      console.error("[updateWatchdog] update released after timeout:", {
        updateId: ctx.update.update_id,
        type: Object.keys(ctx.update).find((key) => key !== "update_id"),
        fromId: ctx.from?.id,
        chatId: ctx.chat?.id,
        timeoutMs,
      })
      task.catch((error) => {
        if (error instanceof ReleasedUpdateError) {
          console.warn(
            "[updateWatchdog] released update finished late, session not saved:",
            { updateId: ctx.update.update_id }
          )
          return
        }
        console.error(
          "[updateWatchdog] released update failed:",
          getSafeErrorDetails(error)
        )
      })
    } finally {
      clearTimeout(timer)
    }
  }
}

// Install directly after session(): grammY's session middleware skips its
// write when a later middleware throws, so a released update that finishes
// late cannot overwrite the newer session of the same user.
export async function skipSessionWriteIfReleased(
  ctx: Context,
  next: NextFunction
): Promise<void> {
  await next()
  if (releasedUpdates.has(ctx)) {
    throw new ReleasedUpdateError()
  }
}

// True once per released user/chat; used to exit the conversation whose
// replay got stuck so the user is not stuck on every later update.
export function consumeReleasedSessionKey(ctx: Context): boolean {
  const key = getSessionKey(ctx)
  return key !== undefined && releasedSessionKeys.delete(key)
}
