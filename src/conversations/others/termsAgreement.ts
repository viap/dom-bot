import { Conversation, ConversationFn } from "@grammyjs/conversations"
import { Keyboard } from "grammy"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { MyContext } from "@/common/types/myContext"
import getAvailableCommandButtons from "@/common/utils/getAvailableCommandButtons"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { BotConversation } from "../types"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { CONVERSATION_TERMS_TEXTS } from "../enums/conversationTermsTexts"

const termsAgreementShow: BotConversation = {
  getName(): CONVERSATION_NAMES {
    return CONVERSATION_NAMES.TERMS_AGREEMENT
  },

  getConversation(): ConversationFn<MyContext> {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<boolean> => {
      if (conversation.session.hasTermsAgreement) {
        await ctx.reply(
          CONVERSATION_TERMS_TEXTS.DESCRIPTION,
          ReplyMarkup.emptyKeyboard
        )
      } else {
        await ctx.reply(CONVERSATION_TERMS_TEXTS.DESCRIPTION, {
          reply_markup: new Keyboard()
            .add({ text: CONVERSATION_TERMS_TEXTS.YES })
            .add({ text: CONVERSATION_TERMS_TEXTS.NO }),
        })

        ctx = await conversation.waitFor(":text")
        const text = ctx.msg?.text || ""

        switch (text) {
          case CONVERSATION_TERMS_TEXTS.YES:
            conversation.session.hasTermsAgreement = true
            await ctx.reply(
              CONVERSATION_TERMS_TEXTS.YES_REPLY,
              ReplyMarkup.emptyKeyboard
            )
            await ctx.reply(BOT_TEXTS.SHOW_COMMAND, {
              reply_markup: getAvailableCommandButtons(ctx.session),
            })
            break
          case CONVERSATION_TERMS_TEXTS.NO:
            conversation.session.hasTermsAgreement = false
            await ctx.reply(
              CONVERSATION_TERMS_TEXTS.NO_REPLY,
              ReplyMarkup.emptyKeyboard
            )
            break
        }
      }

      return conversation.session.hasTermsAgreement
    }
  },
}

export default termsAgreementShow
