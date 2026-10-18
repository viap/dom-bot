import { BOT_COMMANDS } from "@/common/enums/botCommands"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { MyContext } from "@/common/types/myContext"
import { PrimitiveValues } from "@/common/types/primitiveValues"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"

export type CallbackData = {
  [key: string]: PrimitiveValues | Array<PrimitiveValues>
}

export function parseCallbackData(data?: string): CallbackData | undefined {
  try {
    return JSON.parse(data || "")
  } catch {
    return undefined
  }
}

export async function handleCallbackData(
  ctx: MyContext,
  data: CallbackData
): Promise<boolean> {
  if (data.command) {
    switch (data.command) {
      case BOT_COMMANDS.MENU:
        await ctx.conversation.reenter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
        return true
      case BOT_COMMANDS.TERMS_AGREEMENT:
        await ctx.conversation.reenter(CONVERSATION_NAMES.TERMS_AGREEMENT)
        return true
    }
  } else if (data.goTo) {
    switch (data.goTo) {
      case MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW:
        Object.assign(ctx.session, {
          menuDeepLink: { goTo: data.goTo },
        })
        await ctx.conversation.reenter(CONVERSATION_NAMES.SELECT_MENU_ITEM)
        return true
    }
  }

  console.log(BOT_ERRORS.UNKNOWN_CALLBACK, ctx.callbackQuery?.data)
  return false
}

export async function acknowledgeCallback(ctx: MyContext): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => undefined)
  }
}
