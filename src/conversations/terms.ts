import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, Keyboard, SessionFlavor } from "grammy"
import { ReplyMarkup } from "../config/consts"
import { SessionData } from "../types"
import { TERMS } from "./consts"

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
        await ctx.reply(TERMS.DESCRIPTION, {
          reply_markup: ReplyMarkup.emptyKeyboard,
        })
      } else {
        await ctx.reply(TERMS.DESCRIPTION, {
          reply_markup: new Keyboard()
            .add({ text: TERMS.YES })
            .add({ text: TERMS.NO }),
        })

        const response = await conversation.waitFor(":text")

        switch (response.msg.text) {
          case TERMS.YES:
            conversation.session.hasTermsAgreement = true
            await ctx.reply(TERMS.YES_REPLY, {
              reply_markup: ReplyMarkup.emptyKeyboard,
            })
            break
          case TERMS.NO:
            conversation.session.hasTermsAgreement = false
            await ctx.reply(TERMS.NO_REPLY, {
              reply_markup: ReplyMarkup.emptyKeyboard,
            })
            break
        }
      }
      return conversation.session.hasTermsAgreement
    }
  }
}
