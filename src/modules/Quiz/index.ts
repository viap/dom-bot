import { Keyboard } from "grammy"


export type AnswerProps = {
    content: string
    value?: string | number | boolean
}

export type QuestionProps = {
    content: string
    mandatory?: boolean 
    type?: QuestionType
    answers: Array<AnswerProps>
}

export enum QuestionType {
    SINGLE,
    MULTIPLE
}
export class Question {
    content: string
    mandatory: boolean 
    answers: Array<AnswerProps>
    type: QuestionType

    constructor({content="", mandatory=false, answers=[], type=QuestionType.SINGLE}: QuestionProps){
        this.content = content
        this.answers = answers
        this.type = type
        this.mandatory = mandatory
    }
}

export type QuizProps = {
    version?: string
    key?: string
    lang?: QuizLang
    name?: string
    descr?: string
    type?: QuizType
    questions?: Array<QuestionProps>
    givenAnswers?: Array<any>
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

export class Quiz {
    private version: string
    private key: string
    private lang: QuizLang
    private name: string
    private descr: string
    private type: QuizType
    private questions: Array<Question>
    private givenAnswers: Array<AnswerProps>
    private finished: boolean
    private keyboards: Array<Keyboard>

    getResult: (givenAnswers: Array<any>)=>string

    constructor({version="1.0", key="", lang=QuizLang.RUS,name="", descr="", type=QuizType.NORMAL, questions=[], givenAnswers=[], getResult=()=>""}: QuizProps) {
        this.key=key
        this.version = version
        this.lang=lang
        this.name=name
        this.descr=descr
        this.type=type
        this.givenAnswers = []
        this.questions = questions.map((questionProps)=>{
            return new Question(questionProps)
        })

        this.finished = false;
        
        this.getResult = ()=> {
            if(this.givenAnswers.length === this.questions.length) {
                return getResult(this.givenAnswers)
            } else {
                return "Прохождение опроса не завершено"
            }
        }

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
    
    isFinished():boolean {
        return this.finished
    }

    getIndex ():number {
        return this.givenAnswers.length || 0
    }
    
    getKeyboard():Keyboard {
        return this.keyboards[this.getIndex()]
    }

    getQuestion():Question {
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

    private setAnswer (answer?: AnswerProps): boolean{
        if(answer){
            this.givenAnswers.push(answer)
            this.finished = this.givenAnswers.length === this.questions.length
            return true
        } else {
            return false
        }
    }

    serializeProgress(): QuizProps {
        return {
            key: this.key,
            version: this.version,
            lang: this.lang,
            givenAnswers: this.givenAnswers
        } as QuizProps
    }
}
