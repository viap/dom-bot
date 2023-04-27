import { PSY_SCHOOLS } from "../consts"
import { Quiz } from "../index"
import { QuizProps, QuizStatus } from "../../../models/Quiz"

export const firstQuizProps: QuizProps = {
  scales: {
    ANALYZE: PSY_SCHOOLS.ANALYZE,
    CBT: PSY_SCHOOLS.CBT,
    EXISTENSE: PSY_SCHOOLS.EXISTENSE,
    GESTALT: PSY_SCHOOLS.GESTALT,
    SCHIZOPHRENIA: PSY_SCHOOLS.SCHIZOPHRENIA,
  },
  name: "Первый опрос",
  status: QuizStatus.ACTIVE,
  descr: "Будь мужиком - пройди опрос",
  questions: [
    {
      content: "Сколько будет 2+2?",
      answers: [
        {
          content: "1",
          value: 0,
          scales: {
            ANALYZE: 1,
            CBT: 0,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "2",
          value: 0,
          scales: {
            ANALYZE: 0,
            CBT: 1,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "3",
          value: 0,
          scales: {
            ANALYZE: 0,
            CBT: 0,
            EXISTENSE: 1,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "4",
          value: 1,
          scales: {
            ANALYZE: 0,
            CBT: 0,
            EXISTENSE: 0,
            GESTALT: 1,
            SCHIZOPHRENIA: 1,
          },
        },
      ],
    },
    {
      content: "Есть ли жизнь на марсе?",
      answers: [
        {
          content: "да",
          value: 0,
          scales: {
            ANALYZE: 0,
            CBT: 1,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 1,
          },
        },
        {
          content: "нет",
          value: 1,
          scales: {
            ANALYZE: 1,
            CBT: 1,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "наверное",
          value: 2,
          scales: {
            ANALYZE: 0,
            CBT: 0,
            EXISTENSE: 1,
            GESTALT: 1,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "не знаю",
          value: 3,
          scales: {
            ANALYZE: 0,
            CBT: 1,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 1,
          },
        },
      ],
    },
    {
      content: "Выбери лучшую психологическую школу?",
      answers: [
        {
          content: "КБТ",
          value: 1,
          scales: {
            ANALYZE: 0,
            CBT: 1,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "Гештальт",
          value: 1,
          scales: {
            ANALYZE: 0,
            CBT: 0,
            EXISTENSE: 1,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "Экзистенция",
          value: 1,
          scales: {
            ANALYZE: 0,
            CBT: 0,
            EXISTENSE: 0,
            GESTALT: 1,
            SCHIZOPHRENIA: 0,
          },
        },
        {
          content: "Анализ",
          value: 1,
          scales: {
            ANALYZE: 1,
            CBT: 0,
            EXISTENSE: 0,
            GESTALT: 0,
            SCHIZOPHRENIA: 0,
          },
        },
      ],
    },
  ],
}
export const firstQuiz = new Quiz(firstQuizProps)
