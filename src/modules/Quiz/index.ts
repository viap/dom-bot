import { Keyboard } from "grammy"
import { QUIZ_STRINGS } from "./consts"

import { AnswerProps } from "../../models/Answer"
import { GivenAnswer, GivenAnswerProps } from "../../models/GivenAnswer"
import { QuestionProps, QuestionType } from "../../models/Question"
import {
  QuizLang,
  QuizM,
  QuizProps,
  QuizStatus,
  QuizType,
} from "../../models/Quiz"
import mongoose from "mongoose"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import { QuizGivenAnswers, SessionData } from "../../types"
export class QuestionModel {
  content: string
  mandatory: boolean
  answers: Array<AnswerProps>
  type: QuestionType

  constructor({
    content = "",
    mandatory = false,
    answers = [],
    type = QuestionType.SINGLE,
  }: QuestionProps) {
    this.content = content
    this.answers = answers
    this.type = type
    this.mandatory = mandatory
  }
}

export class Quiz {
  private _id: mongoose.Types.ObjectId
  private lang: QuizLang
  private name: string
  private descr: string
  private type: QuizType
  private status: QuizStatus
  private questions: Array<QuestionModel>
  private givenAnswers: Array<GivenAnswerProps>
  private keyboards: Array<Keyboard>
  private scales: { [key: string]: number }

  constructor({
    _id,
    lang = QuizLang.RUS,
    name = "",
    descr = "",
    type = QuizType.NORMAL,
    status = QuizStatus.DISABLED,
    questions = [],
    givenAnswers = [],
    scales = {},
  }: QuizProps) {
    this._id = _id
    this.lang = lang
    this.name = name
    this.descr = descr
    this.type = type
    this.status = status
    this.givenAnswers = givenAnswers
    this.scales = scales
    this.questions = questions.map((questionProps) => {
      return new QuestionModel(questionProps)
    })

    this.keyboards = this.questions.map((question) => {
      const rowLength = 2
      const keyboard = new Keyboard()

      question.answers.map((answer, index) => {
        keyboard.add({ text: answer.content })
        if (index % rowLength) {
          keyboard.row()
        }
      })

      if (this.type === QuizType.NORMAL) {
        keyboard
          .row()
          .add({ text: QUIZ_STRINGS.QUESTION_PREV })
          .add({ text: QUIZ_STRINGS.QUESTION_NEXT })
        // .row()
        // .add({text: "Сбросить"})
      }

      return keyboard
    })
  }

  // METHODS: public

  isPassed(): boolean {
    return this.givenAnswers.length === this.questions.length
  }

  clearProgress() {
    this.givenAnswers = []
  }

  setAnswers(givenAnswers: Array<GivenAnswerProps>) {
    this.givenAnswers = givenAnswers
  }

  serializeQuiz(): QuizProps {
    return {
      name: this.name,
      descr: this.descr,
      lang: this.lang,
      type: this.type,
      status: this.status,
      questions: this.questions,
      scales: this.scales,
    } as QuizProps
  }

  saveQuizModel() {
    const quiz = new QuizM(this.serializeQuiz())
    quiz.save()
  }

  // METHODS: private

  private setAnswer(givenAnswer: GivenAnswerProps): boolean {
    this.givenAnswers.push(givenAnswer)
    return true
  }

  // GETTERS

  getResult = () => {
    const questions = this.questions
    if (this.givenAnswers.length === this.questions.length) {
      const results: { [key: string]: number } = {}

      this.givenAnswers.forEach((givenAnswer) => {
        const scales =
          questions[givenAnswer.question].answers[givenAnswer.answer].scales ||
          {}
        const keys = Object.keys(scales)

        keys.forEach((key) => {
          results[key] = (results[key] || 0) + scales[key]
        })
      })

      let finalResult:
        | { key: string; value: number; outcome: Array<number> }
        | undefined

      Object.entries(results).forEach((entry) => {
        if (!finalResult || finalResult.value <= entry[1]) {
          const outcome: Array<number> =
            finalResult?.value === entry[1] ? finalResult.outcome : []
          outcome.push(this.scales[entry[0]] || 0)

          finalResult = {
            key: entry[0],
            value: entry[1],
            outcome: outcome,
          }
        }
      })

      return (
        finalResult?.outcome.join(` ${QUIZ_STRINGS.RESULT_OR} `) ||
        QUIZ_STRINGS.RESULT_EMPTY
      )
    } else {
      return QUIZ_STRINGS.RESULT_NOT_FINISHED
    }
  }

  getName(): string {
    return this.name
  }

  getDescr(): string {
    return this.descr
  }

  getIndex(): number {
    return this.givenAnswers.length || 0
  }

  getKeyboard(): Keyboard {
    return this.keyboards[this.getIndex()]
  }

  getQuestion(): QuestionModel {
    const index = this.givenAnswers.length || 0
    return this.questions[index] || this.questions[this.questions.length - 1]
  }

  getQuestionIndex(): number {
    return this.givenAnswers.length
  }

  getQuizGivenAnswers(): QuizGivenAnswers {
    return { [this._id.toString()]: this.givenAnswers }
  }

  // SETTERS

  setAnswerByResponse(response: string): boolean {
    const question = this.getQuestion()
    if (question) {
      const answerIndex = question.answers.findIndex(
        (answer) => answer.content === response
      )

      if (answerIndex >= 0) {
        return this.setAnswer({
          question: this.getQuestionIndex(),
          answer: answerIndex,
        })
      }
    }

    return false
  }

  // NOTICE: не используется
  // setAnswerByIndex(index: number): boolean {
  //   const question = this.getQuestion()
  //   if (question) {
  //     const answer = question.answers[index]
  //     return this.setAnswer(answer)
  //   }
  //   return false
  // }
}
