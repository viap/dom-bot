import {AnswerProps, Quiz} from "../index"

enum FirstQuizScales {
    ANALYZE="ANALYZE",
    CBT="CBT",
    EXISTENSE="EXISTENSE",
    GESTALT="GESTALT",
    SCHIZOPHRENIA="SCHIZOPHRENIA"
}
export const firstQuiz = new Quiz<FirstQuizScales> (
    {
        key: "quiz1", 
        name:"Первый опрос", 
        descr:"Будь мужиком - пройди опрос", 
        questions:[
            {
                content:"Сколько будет 2+2?", 
                answers:[
                    {content:"1", value: 0, scales: {
                            [FirstQuizScales.ANALYZE]:1,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"2", value: 0, scales: {
                        [FirstQuizScales.ANALYZE]:0,
                        [FirstQuizScales.CBT]:1,
                        [FirstQuizScales.EXISTENSE]:0,
                        [FirstQuizScales.GESTALT]:0,
                        [FirstQuizScales.SCHIZOPHRENIA]:0,
                    }
                }, 
                    {content:"3", value: 0, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:1,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"4", value: 1, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:1,
                            [FirstQuizScales.SCHIZOPHRENIA]:1,
                        }
                    }
                ]
            },
            {
                content:"Есть ли жизнь на марсе?", 
                answers:[
                    {content:"да", value: 0, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:1,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:1,
                        }
                    }, 
                    {content:"нет", value: 1, scales: {
                            [FirstQuizScales.ANALYZE]:1,
                            [FirstQuizScales.CBT]:1,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"наверное", value: 2, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:1,
                            [FirstQuizScales.GESTALT]:1,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"не знаю", value: 3, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:1,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:1,
                        }
                    }]
            },
            {
                content:"Выбери лучшую психологическую школу?", 
                answers:[
                    {content:"КБТ", value: 1, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:1,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"Гештальт", value: 1, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:1,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"Экзистенция", value: 1, scales: {
                            [FirstQuizScales.ANALYZE]:0,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:1,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }, 
                    {content:"Анализ", value: 1, scales: {
                            [FirstQuizScales.ANALYZE]:1,
                            [FirstQuizScales.CBT]:0,
                            [FirstQuizScales.EXISTENSE]:0,
                            [FirstQuizScales.GESTALT]:0,
                            [FirstQuizScales.SCHIZOPHRENIA]:0,
                        }
                    }]
            },
        ],
        outcome: {
            [FirstQuizScales.ANALYZE]: "Анализ",
            [FirstQuizScales.CBT]: "КБТ",
            [FirstQuizScales.EXISTENSE]: "Экзистенциальная школа",
            [FirstQuizScales.GESTALT]: "Гештальт",
            [FirstQuizScales.SCHIZOPHRENIA]: "Шизофрения",
        }
    }
)