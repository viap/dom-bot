import { Conversation, ConversationFn } from "@grammyjs/conversations"
import { getTextOfData } from "@/common/utils/getTextOfData"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { BotConversation } from "../types/botConversation"
import { CONVERSATION_NAMES } from "../enums/conversationNames"

const termsAgreementShow: BotConversation = {
  getName(): CONVERSATION_NAMES {
    return CONVERSATION_NAMES.REQUISITES
  },

  getConversation(): ConversationFn<MyContext> {
    return async (_conversation: Conversation<MyContext>, ctx: MyContext) => {
      const content = getTextOfData(
        "",
        {
          bank: "JSC TBC Bank",
          iban: "GE54TB7471136010100058",
          name: "P/E Vladislav Birilov",
        },
        {
          bank: "Beneficiary’s Bank",
          iban: "Beneficiary’s IBAN",
          name: "Name of Beneficiary",
        }
      )

      await ctx.reply(content, {
        ...ReplyMarkup.emptyKeyboard,
        ...ReplyMarkup.parseModeV2,
      })
    }
  },
}

export default termsAgreementShow
