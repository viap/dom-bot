import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, Keyboard, SessionFlavor } from "grammy"
import { ReplyMarkup } from "../common/consts/replyMarkup"
import { SessionData } from "../types/sessionData"
import { CONVERSATION_TERMS_TEXTS } from "./enums/conversationTermsTexts.enum"

export class Terms<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  //   constructor() {}

  getConversation() {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<boolean> => {
      if (conversation.session.hasTermsAgreement) {
        await ctx.reply(CONVERSATION_TERMS_TEXTS.DESCRIPTION, {
          reply_markup: ReplyMarkup.emptyKeyboard,
        })
      } else {
        await ctx.reply(CONVERSATION_TERMS_TEXTS.DESCRIPTION, {
          reply_markup: new Keyboard()
            .add({ text: CONVERSATION_TERMS_TEXTS.YES })
            .add({ text: CONVERSATION_TERMS_TEXTS.NO }),
        })

        const response = await conversation.waitFor(":text")

        switch (response.msg.text) {
          case CONVERSATION_TERMS_TEXTS.YES:
            conversation.session.hasTermsAgreement = true
            await ctx.reply(CONVERSATION_TERMS_TEXTS.YES_REPLY, {
              reply_markup: ReplyMarkup.emptyKeyboard,
            })
            break
          case CONVERSATION_TERMS_TEXTS.NO:
            conversation.session.hasTermsAgreement = false
            await ctx.reply(CONVERSATION_TERMS_TEXTS.NO_REPLY, {
              reply_markup: ReplyMarkup.emptyKeyboard,
            })
            break
        }
      }
      return conversation.session.hasTermsAgreement
    }
  }
}
