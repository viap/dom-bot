import { MemorySessionStorage, MiddlewareFn } from "grammy"
import { createDomBot } from "@/createDomBot"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
import { SessionData } from "@/common/types/sessionData"
import { makePsychologist, makeUser } from "./fixtures"
import { installTelegramApiRecorder } from "./telegram"

export async function createTestBot({
  roles = [ROLES.USER],
  session = {},
  authMiddleware,
}: {
  roles?: Array<ROLES>
  session?: Partial<SessionData>
  authMiddleware?: MiddlewareFn<MyContext>
} = {}) {
  const storage = new MemorySessionStorage<SessionData>()
  const bot = createDomBot({
    token: "123:test-token",
    botConfig: {
      botInfo: {
        id: 123,
        is_bot: true,
        first_name: "DOM Test Bot",
        username: "dom_test_bot",
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
      },
    },
    sessionStorage: storage,
    authMiddleware:
      authMiddleware ||
      (async (ctx, next) => {
        if (ctx.from && ctx.chat && !ctx.from.is_bot) {
          const user = makeUser({ roles })
          Object.assign(ctx.session, {
            token: "test-token",
            user,
            psychologist: roles.includes(ROLES.PSYCHOLOGIST)
              ? makePsychologist({ user })
              : undefined,
            ...session,
          })
        }

        return next()
      }),
  })
  const telegram = installTelegramApiRecorder(bot)

  return { bot, storage, telegram }
}
