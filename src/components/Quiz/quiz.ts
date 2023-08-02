import { Keyboard } from "grammy"
import { QUIZ_TEXTS } from "./enums/quizTexts.enum"

import mongoose from "mongoose"
import { AnswerProps } from "./types/answerProps"
import { GivenAnswerProps } from "./types/givenAnswerProps"
import { QuestionProps } from "./types/questionProps"
import { QuestionTypes } from "./enums/quiestionTypes.enum"
import { QuizModel } from "./models/quiz.model"
import { QuizProps } from "./types/quizProps"
import { QuizTypes } from "./enums/quizTypes.enum"
import { QuizScalesResult } from "./types/quizScalesResult"
import { QuizStatus } from "./enums/quizStatus.enum"
import { QuizLang } from "./enums/quizLang.enum"
import { QuizGivenAnswers } from "./types/quizGivenAnswers"

export class QuestionModel {
  content: string
  mandatory: boolean
  answers: Array<AnswerProps>
  type?: QuestionTypes

  constructor({
    content = "",
    mandatory = false,
    answers = [],
    type = QuestionTypes.SINGLE,
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
  private type: QuizTypes
  private status: QuizStatus
  private questions: Array<QuestionProps>
  private givenAnswers: Array<GivenAnswerProps>
  private keyboards: Array<Keyboard>
  private scales: { [key: string]: string }

  constructor({
    _id,
    lang = QuizLang.RUS,
    name = "",
    descr = "",
    type = QuizTypes.NORMAL,
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

      if (this.type === QuizTypes.NORMAL) {
        keyboard
          .row()
          .add({ text: QUIZ_TEXTS.QUESTION_PREV })
          .add({ text: QUIZ_TEXTS.QUESTION_NEXT })
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
    const quiz = new QuizModel(this.serializeQuiz())
    quiz.save()
  }

  // METHODS: private

  private setAnswer(givenAnswer: GivenAnswerProps): boolean {
    this.givenAnswers.push(givenAnswer)
    return true
  }

  // GETTERS

  getResult() {
    const questions = this.questions
    // const scales = this.scales
    const results: QuizScalesResult = {}

    if (this.givenAnswers.length === this.questions.length) {
      this.givenAnswers.forEach((givenAnswer) => {
        const scalesValues =
          questions[givenAnswer.question].answers[givenAnswer.answer].scales ||
          {}
        const keys = Object.keys(scalesValues)

        keys.forEach((key) => {
          results[key] = (results[key] || 0) + scalesValues[key]
        })
      })
    }

    return results
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

  getQuestion(): QuestionProps {
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
