import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, Keyboard, SessionFlavor } from "grammy"
import mongoose from "mongoose"
import { QUIZ_MSG, ReplyMarkup } from "../config/consts"
import { QuizM } from "../models/Quiz"
import { Quiz } from "../modules/Quiz/index"
import { SessionData } from "../types"

import { Terms } from "./terms"
import { SelectQiuz } from "./selectQuiz"
import { GivenAnswer, GivenAnswerProps } from "../models/GivenAnswer"

export class QuizProgress<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  private quiz?: Quiz

  // constructor() {}

  private async checkAgreemensts(
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ): Promise<boolean> {
    // ask for agreement if it is not get yet
    if (!conversation.session.hasTermsAgreement) {
      const terms = new Terms<MyContext>()
      const termsComversation = terms.getConversation()
      conversation.session.hasTermsAgreement = await termsComversation(
        conversation,
        ctx
      )
      // conversation.session.hasTermsAgreement = await conversation.external(() =>
      //   termsComversation(conversation, ctx)
      // )
    }

    return conversation.session.hasTermsAgreement
  }

  private async selectQuiz(
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) {
    const selectQuiz = new SelectQiuz<MyContext>()
    const selectQuizComversation = selectQuiz.getConversation()
    await selectQuizComversation(conversation, ctx)
  }

  private async loadQuiz(
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) {
    if (ctx.session.selectedQuiz && ctx.session.selectedQuiz._id) {
      const quizProps = await QuizM.findOne({
        _id: ctx.session.selectedQuiz,
      }).exec()

      if (quizProps) {
        const givenAnswers: Array<GivenAnswerProps> =
          conversation.session.quizAnswers[quizProps._id.toString()] || []

        this.quiz = new Quiz(quizProps)
        this.quiz.setAnswers(givenAnswers)
      }
    }
  }

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      if (!(await this.checkAgreemensts(conversation, ctx))) {
        return
      }

      await this.selectQuiz(conversation, ctx)
      await this.loadQuiz(conversation, ctx)

      if (this.quiz === undefined) {
        return
      }

      if (this.quiz.isPassed()) {
        await ctx.reply(QUIZ_MSG.REPLAY, {
          reply_markup: new Keyboard()
            .add({ text: QUIZ_MSG.REPLAY_YES })
            .add({ text: QUIZ_MSG.REPLAY_NO })
            .row()
            .add({ text: QUIZ_MSG.SHOW_RESULT })
            .oneTime(true),
        })
        const response = await conversation.waitFor("message:text")

        switch (response.msg.text) {
          case QUIZ_MSG.REPLAY_YES:
            this.quiz.clearProgress()
            break
          case QUIZ_MSG.REPLAY_NO:
            return await ctx.reply(QUIZ_MSG.REPLAY_NO_REPLY)
          case QUIZ_MSG.SHOW_RESULT:
            return await ctx.reply(this.quiz.getResult())
        }
      }

      if (!this.quiz.isPassed()) {
        while (!this.quiz.isPassed()) {
          conversation.log("this.quiz.getQuestion()", this.quiz.getQuestion())

          await ctx.reply(this.quiz.getQuestion().content, {
            reply_markup: this.quiz.getKeyboard().oneTime(true),
          })

          const response = await conversation.waitFor("message:text")

          if (this.quiz.setAnswerByResponse(response.msg.text)) {
            conversation.session.quizAnswers = this.quiz.getQuizGivenAnswers()
          } else {
            ctx.reply(QUIZ_MSG.UNKNOWN_ANSWER)
          }
        }

        await ctx.reply(QUIZ_MSG.CONGRATS)
        await ctx.reply(this.quiz.getResult())
      }
    }
  }
}
