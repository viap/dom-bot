import { Conversation, ConversationFn } from "@grammyjs/conversations"
import { getTextOfRequisites } from "@/common/texts/getTextOfRequisites"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { BotConversation } from "../types/botConversation"
import { CONVERSATION_NAMES } from "../enums/conversationNames"

const requisitesShow: BotConversation = {
  getName(): CONVERSATION_NAMES {
    return CONVERSATION_NAMES.REQUISITES
  },

  getConversation(): ConversationFn<MyContext> {
    return async (_conversation: Conversation<MyContext>, ctx: MyContext) => {
      await ctx.reply(getTextOfRequisites(), {
        ...ReplyMarkup.emptyKeyboard,
        ...ReplyMarkup.parseModeV2,
      })
    }
  },
}

export default requisitesShow
