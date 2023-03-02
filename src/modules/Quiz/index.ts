import { Keyboard } from "grammy"


export type AnswerProps<T extends string> = {
    content: string
    value?: string | number | boolean
    scales: {[key in T]:number}
}

export type QuestionProps<T extends string> = {
    content: string
    mandatory?: boolean 
    type?: QuestionType
    answers: Array<AnswerProps<T>>
}

export enum QuestionType {
    SINGLE,
    MULTIPLE
}
export class Question<T extends string> {
    content: string
    mandatory: boolean 
    answers: Array<AnswerProps<T>>
    type: QuestionType

    constructor({content="", mandatory=false, answers=[], type=QuestionType.SINGLE}: QuestionProps<T>){
        this.content = content
        this.answers = answers
        this.type = type
        this.mandatory = mandatory
    }
}

export type QuizProps<T extends string> = {
    version?: string
    key?: string
    lang?: QuizLang
    name?: string
    descr?: string
    type?: QuizType
    questions?: Array<QuestionProps<T>>
    givenAnswers?: Array<any>
    outcome: {[key in T]?:string}
    getResult?: (givenAnswers: Array<any>)=>string
}

export enum QuizType {
    NORMAL,
    CONSISTENT
}

export enum QuizLang {
    RUS,
    EN,
    GE
}

export class Quiz <T extends string> {
    private version: string
    private key: string
    private lang: QuizLang
    private name: string
    private descr: string
    private type: QuizType
    private questions: Array<Question<T>>
    private givenAnswers: Array<AnswerProps<T>>
    private keyboards: Array<Keyboard>
    private outcome: {[key in T]?:string}

    constructor({version="1.0", key="", lang=QuizLang.RUS,name="", descr="", type=QuizType.NORMAL, questions=[], givenAnswers=[], outcome={}}: QuizProps<T>) {
        this.key=key
        this.version = version
        this.lang=lang
        this.name=name
        this.descr=descr
        this.type=type
        this.givenAnswers = []
        this.outcome = outcome
        this.questions = questions.map((questionProps)=>{
            return new Question<T>(questionProps)
        })

        this.keyboards = this.questions.map((question) => {
            const rowLength = 2
            const keyboard = new Keyboard()

            question.answers.map((answer, index)=>{
                keyboard.add({text:answer.content})
                if(index % rowLength){
                    keyboard.row()
                }
            })

            if(this.type === QuizType.NORMAL){
                keyboard.row()
                    .add({text:"<"})
                    .add({text:">"})
                    // .row()
                    // .add({text: "Сбросить"})
            }

            return keyboard
        })
    }

    getResult = ()=> {
        if(this.givenAnswers.length === this.questions.length) {
            const results: {[key:string]: number} = {}

            this.givenAnswers.forEach((answer)=>{
                const keys = Object.keys(answer.scales)

                keys.forEach((key)=>{
                    results[key] = (results[key] || 0) + answer.scales[key as T]
                })
            })

            let finalResult: {key: string, value: number, outcome: Array<string>} | undefined
            Object.entries(results).forEach((entry)=>{
                if(!finalResult || finalResult.value <= entry[1]) {
                    const outcome: Array<string> = finalResult?.value === entry[1] ? finalResult.outcome: []
                    outcome.push(this.outcome[entry[0] as T] || "")

                    finalResult = {
                        key: entry[0],
                        value: entry[1],
                        outcome: outcome
                    }
                }
            })

            return finalResult?.outcome.join(" или ") || ""
        } else {
            return "Прохождение опроса не завершено"
        }
    }
    
    clearProgress(){
        this.givenAnswers = []
    }

    isPassed():boolean {
        return this.givenAnswers.length === this.questions.length
    }

    getIndex ():number {
        return this.givenAnswers.length || 0
    }
    
    getKeyboard():Keyboard {
        return this.keyboards[this.getIndex()]
    }

    getQuestion():Question<T> {
        const index = this.givenAnswers.length
        return this.questions[index] || this.questions[this.questions.length-1]
    }
    
    setAnswerByResponse(response: string): boolean {
        const question = this.getQuestion()
        if(question){
            const answer = question.answers.find((answer)=> answer.content === response)
            return this.setAnswer(answer)
        }
        return false
    }
    
    setAnswerByIndex(index: number): boolean {
        const question = this.getQuestion()
        if(question){
            const answer = question.answers[index]
            return this.setAnswer(answer)
        }
        return false
    }

    private setAnswer (answer?: AnswerProps<T>): boolean {
        if(answer){
            this.givenAnswers.push(answer)
            return true
        } else {
            return false
        }
    }

    serializeProgress(): QuizProps<T> {
        return {
            key: this.key,
            version: this.version,
            lang: this.lang,
            givenAnswers: this.givenAnswers
        } as QuizProps<T>
    }
}
