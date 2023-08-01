import { Quiz } from "../components/Quiz/index"
import { Conversation, ConversationFlavor } from "@grammyjs/conversations"
import { Context, InputFile, Keyboard, SessionFlavor } from "grammy"
import { listOfPsychologists } from "../config/consts"
import { QuizM, QuizScalesResult } from "../models/Quiz"
import { Psychologist } from "../types"

import { GivenAnswerProps } from "../models/GivenAnswer"
import { PSY_SCHOOLS, getPsySchoolDescr } from "../components/Quiz/consts"
import { SelectQiuz } from "./selectQuiz"
import { Terms } from "./terms"

import { getValueByKey } from "../common/utils"
import { cwd } from "process"
import { QUIZ_MSG } from "./consts"
import { SessionData } from "../types/sessionData"

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
            await this.showResultInterpretation(ctx, this.quiz.getResult())
            return true
        }
      }

      if (!this.quiz.isPassed()) {
        while (!this.quiz.isPassed()) {
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
        await this.showResultInterpretation(ctx, this.quiz.getResult())
        return true
      }
    }
  }

  private async showResultInterpretation(
    ctx: MyContext,
    scalesResult: QuizScalesResult
  ) {
    const result: { max: number; winners: Array<string> } = {
      max: 0,
      winners: [],
    }

    Object.entries(scalesResult).map((entry) => {
      if (entry[1] > result.max) {
        result.max = entry[1]
        result.winners = [entry[0]]
      } else if (entry[1] === result.max) {
        result.winners.push(entry[0])
      }
    })

    await ctx.reply("Вам подходят следующие направления:")

    const suitableSpecialists: Array<Psychologist<PSY_SCHOOLS>> = []

    const schoolInfo: Array<string> = []
    result.winners.forEach((school: string) => {
      const schoolValue = getValueByKey(PSY_SCHOOLS, school) as PSY_SCHOOLS

      schoolInfo.push(`*${school}*  
      _${getPsySchoolDescr(schoolValue)}_`)

      suitableSpecialists.push(
        ...listOfPsychologists.filter((psycholog) => {
          return psycholog.schools.includes(schoolValue)
        })
      )
    })

    await ctx.reply(schoolInfo.join("\r\n\r\n"), { parse_mode: "MarkdownV2" })

    if (suitableSpecialists.length) {
      await ctx.reply(
        "Психологический центр DOM предлагает следующих специалистов:"
      )

      const uniqSpecialists = new Set<Psychologist<PSY_SCHOOLS>>(
        suitableSpecialists
      )

      const specialistIterator = uniqSpecialists.entries()
      let iterItem: IteratorResult<
        [Psychologist<PSY_SCHOOLS>, Psychologist<PSY_SCHOOLS>]
      >

      do {
        iterItem = specialistIterator.next()
        if (!iterItem.done) {
          const person = iterItem.value[1]
          await this.replyPsychologistInfo(ctx, person)
        }
      } while (iterItem && !iterItem.done)

      // const psychologistsInfo = suitableSpecialists.map(this.psychologToMessage)
      // await ctx.reply(psychologistsInfo.join(" / "))
    } else {
      await ctx.reply("К сожалению у нас нет таких специалистов :-(")
    }
  }

  private async replyPsychologistInfo(
    ctx: MyContext,
    psychologist: Psychologist<PSY_SCHOOLS>
  ) {
    if (psychologist.photo) {
      const address = cwd() + `/dist/assets/photos/${psychologist.photo}`

      console.log("address", address)
      const photo: InputFile = new InputFile(address, psychologist.photo)
      await ctx.replyWithPhoto(photo)
    }
    await ctx.reply(psychologist.name)
    if (psychologist.descr) {
      await ctx.reply(psychologist.descr)
    }

    return true
  }
}
