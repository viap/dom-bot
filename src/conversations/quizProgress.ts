import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, Keyboard, SessionFlavor } from "grammy"
import { QUIZ_MSG, ReplyMarkup } from "../config/consts"
import { Quiz } from "../modules/Quiz"
import { SessionData } from "../types"

import { Terms } from "./terms"

export class QuizProgress<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  private quiz: Quiz<any>

  constructor(quiz: Quiz<any>) {
    this.quiz = quiz
  }

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      const self = this

      // ask for agreement if it is not get yet
      if (!ctx.session.hasTermsAgreement) {
        const terms = new Terms<MyContext>()
        const termsComversation = terms.getConversation()
        conversation.session.hasTermsAgreement = await termsComversation(
          conversation,
          ctx
        )
        if (!conversation.session.hasTermsAgreement) {
          return
        }
      }

      if (self.quiz.isPassed()) {
        await ctx.reply(QUIZ_MSG.REPLAY, {
          reply_markup: new Keyboard()
            .add({ text: QUIZ_MSG.REPLAY_YES })
            .add({ text: QUIZ_MSG.REPLAY_NO })
            .row()
            .add({ text: QUIZ_MSG.SHOW_RESULT })
            .oneTime(true),
        })
        const response = await conversation.waitFor(":text")

        switch (response.msg.text) {
          case QUIZ_MSG.REPLAY_YES:
            self.quiz.clearProgress()
            break
          case QUIZ_MSG.REPLAY_NO:
            return await ctx.reply(QUIZ_MSG.REPLAY_NO_REPLY)
          case QUIZ_MSG.SHOW_RESULT:
            return await ctx.reply(self.quiz.getResult())
        }
      }

      while (!self.quiz.isPassed()) {
        ctx.reply(self.quiz.getQuestion().content, {
          reply_markup: self.quiz.getKeyboard().oneTime(true),
        })
        const response = await conversation.waitFor(":text")
        self.quiz.setAnswerByResponse(response.msg.text)
      }

      await ctx.reply(QUIZ_MSG.CONGRATS)
      await ctx.reply(self.quiz.getResult())
      return
    }
  }
}
