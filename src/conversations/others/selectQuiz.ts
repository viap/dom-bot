import { Conversation } from "@grammyjs/conversations"
import { Keyboard } from "grammy"
import { BOT_COMMANDS_DESCR } from "@/common/enums/botCommandsDescr"
import { QUIZ_STATUS } from "@/components/Quiz/enums/quizStatus"
import { QuizModel } from "@/components/Quiz/models/quiz"
import { MyContext } from "@/common/types/myContext"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"

const qiuzSelect: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.SELECT_QUIZ
  },

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      const quizes = await QuizModel.find({ status: QUIZ_STATUS.ACTIVE }).exec()

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

        ctx = await conversation.waitFor(":text")
        const text = ctx.msg?.text || ""

        const selectedQiuz = quizes.find((quiz) => quiz.name === text)

        if (selectedQiuz) {
          conversation.session.selectedQuiz = selectedQiuz._id
        }
      }

      return conversation.session.selectedQuiz
    }
  },
}

export default qiuzSelect
