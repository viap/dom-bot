import { Conversation } from "@grammyjs/conversations"
import { InputFile, Keyboard } from "grammy"
import { QuizModel } from "../components/Quiz/models/quiz.model"
import { Quiz } from "../components/Quiz/quiz"
import { QuizScalesResult } from "../components/Quiz/types/quizScalesResult"
import { ContactInfo, Psychologist } from "../types"

import { PSY_SCHOOLS } from "../common/enums/psySchools.enum"
import { getPsySchoolDescr } from "../common/utils/getPsySchoolDescr"
import { GivenAnswerProps } from "../components/Quiz/types/givenAnswerProps"

import { cwd } from "process"
import { getValueByKey } from "../common/utils/getValueByKey"
import { ReplyMarkup } from "../common/utils/replyMarkup"
import { MyContext } from "../types/myContext"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { CONVERSATION_QUIZ_TEXTS } from "./enums/conversationQuizTexts.enum"
import { BotConversations } from "./index"

export const commonContacts: ContactInfo = {
  telegram: "Soroka_tg",
  instagram: "psydom_tbilisi",
  whatsapp: "",
  phone: "995557701626",
}

export const listOfPsychologists: Array<Psychologist<PSY_SCHOOLS>> = [
  {
    schools: [
      PSY_SCHOOLS.EXISTENSE,
      PSY_SCHOOLS.ANALYZE,
      PSY_SCHOOLS.CBT,
      PSY_SCHOOLS.GESTALT,
    ],
    name: "Алёна Чалова",
    descr: "Кандидат психологических наук и бла бла бла",
    photo: "chalova_alena.png",
    contacts: commonContacts,
  },
  {
    schools: [PSY_SCHOOLS.ANALYZE],
    name: "Виктор Заикин",
    descr: "Кандидат психологических наук и бла, бла, бла ...",
    photo: "",
    contacts: commonContacts,
  },
]

export class QuizProgress {
  private quiz?: Quiz

  // constructor() {}

  private async checkAgreemensts(
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ): Promise<boolean> {
    // ask for agreement if it is not get yet
    if (!conversation.session.hasTermsAgreement) {
      const termsComversation = BotConversations.getByName(
        CONVERSATION_NAMES.TERMS_AGREEMENT
      )

      if (termsComversation) {
        await termsComversation.getConversation(conversation, ctx)
      }
    }

    return conversation.session.hasTermsAgreement
  }

  private async selectQuiz(
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) {
    const selectQuizComversation = BotConversations.getByName(
      CONVERSATION_NAMES.SELECT_QUIZ
    )

    if (selectQuizComversation) {
      await selectQuizComversation.getConversation(conversation, ctx)
    }
  }

  private async loadQuiz(
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) {
    if (ctx.session.selectedQuiz && ctx.session.selectedQuiz._id) {
      const quizProps = await QuizModel.findOne({
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
        await ctx.reply(CONVERSATION_QUIZ_TEXTS.REPLAY, {
          reply_markup: new Keyboard()
            .add({ text: CONVERSATION_QUIZ_TEXTS.REPLAY_YES })
            .add({ text: CONVERSATION_QUIZ_TEXTS.REPLAY_NO })
            .row()
            .add({ text: CONVERSATION_QUIZ_TEXTS.SHOW_RESULT })
            .oneTime(true),
        })
        ctx = await conversation.waitFor("message:text")
        const text = ctx.msg?.text || ""

        switch (text) {
          case CONVERSATION_QUIZ_TEXTS.REPLAY_YES:
            this.quiz.clearProgress()
            break
          case CONVERSATION_QUIZ_TEXTS.REPLAY_NO:
            return await ctx.reply(CONVERSATION_QUIZ_TEXTS.REPLAY_NO_REPLY)
          case CONVERSATION_QUIZ_TEXTS.SHOW_RESULT:
            await this.showResultInterpretation(ctx, this.quiz.getResult())
            return true
        }
      }

      if (!this.quiz.isPassed()) {
        while (!this.quiz.isPassed()) {
          await ctx.reply(this.quiz.getQuestion().content, {
            reply_markup: this.quiz.getKeyboard().oneTime(true),
          })

          ctx = await conversation.waitFor("message:text")
          const text = ctx.msg?.text || ""

          if (this.quiz.setAnswerByResponse(text)) {
            conversation.session.quizAnswers = this.quiz.getQuizGivenAnswers()
          } else {
            await ctx.reply(CONVERSATION_QUIZ_TEXTS.UNKNOWN_ANSWER)
          }
        }

        await ctx.reply(CONVERSATION_QUIZ_TEXTS.CONGRATS)
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

    await ctx.reply(schoolInfo.join("\r\n\r\n"), ReplyMarkup.parseModeV2)

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
