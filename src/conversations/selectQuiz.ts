import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { BOT_COMMANDS_DESCR } from "../config/consts"
import { Context, Keyboard, SessionFlavor } from "grammy"
import { QuizM, QuizStatus } from "../models/Quiz"
import { SessionData } from "../types"

export class SelectQiuz<
  MyContext extends Context & SessionFlavor<SessionData> & ConversationFlavor
> {
  //   constructor() {}

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      const quizes = await QuizM.find({ status: QuizStatus.ACTIVE }).exec()

      if (quizes.length === 1) {
        conversation.session.selectedQuiz = quizes[0]._id
      } else {
        const keyboard = new Keyboard()
        quizes.forEach((quiz) => {
          keyboard.add({ text: quiz.name })
        })

        await ctx.reply(BOT_COMMANDS_DESCR.SELECT_QUIZ, {
          reply_markup: keyboard,
        })

        const response = await conversation.waitFor(":text")

        const selectedQiuz = quizes.find(
          (quiz) => quiz.name === response.msg.text
        )

        if (selectedQiuz) {
          conversation.session.selectedQuiz = selectedQiuz._id
        }
      }

      return conversation.session.selectedQuiz
    }
  }
}
