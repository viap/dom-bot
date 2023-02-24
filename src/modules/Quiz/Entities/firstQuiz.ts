import {AnswerProps, Quiz} from "../index"

export const firstQuiz = new Quiz (
    {
        key: "quiz1", 
        name:"Первый опрос", 
        descr:"Будь мужиком - пройди опрос", 
        questions:[
            {
                content:"Сколько будет 2+2?", 
                answers:[
                    {content:"1", value: 0}, 
                    {content:"2", value: 0}, 
                    {content:"3", value: 0}, 
                    {content:"4", value: 1}]
            },
            {
                content:"Есть ли жизнь на марсе?", 
                answers:[
                    {content:"да", value: 0}, 
                    {content:"нет", value: 1}, 
                    {content:"наверное", value: 2}, 
                    {content:"не знаю", value: 3}]
            },
            {
                content:"Выбери лучшую психологическую школу?", 
                answers:[
                    {content:"КБТ", value: 1}, 
                    {content:"Гештальт", value: 1}, 
                    {content:"Экзистенция", value: 1}, 
                    {content:"Анализ", value: 1}]
            },
        ], 
        getResult:(givenAnswers: Array<AnswerProps>) => {
            return givenAnswers.map((answer)=>(answer.value || "").toString()).join(" | ")
        }
    }
)