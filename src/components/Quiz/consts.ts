export enum QUIZ_STRINGS {
  QUESTION_NEXT = "<",
  QUESTION_PREV = ">",
  RESULT_EMPTY = "Результат невозможно вычислить",
  RESULT_OR = "или",
  RESULT_NOT_FINISHED = "Прохождение опроса не завершено",
}

export enum PSY_SCHOOLS {
  ANALYZE = "Анализ",
  CBT = "КБТ",
  EXISTENSE = "Экзистенциальная школа",
  GESTALT = "Гештальт",
  SCHIZOPHRENIA = "Шизофрения", // вариант для шизо-вопросов
}

export const getPsySchoolDescr = (school: PSY_SCHOOLS): string => {
  switch (school) {
    case PSY_SCHOOLS.ANALYZE:
      return "Описание школы Анализа"
    case PSY_SCHOOLS.CBT:
      return "Описание школы КБТ"
    case PSY_SCHOOLS.EXISTENSE:
      return "Описание школы Экзистенциальной"
    case PSY_SCHOOLS.GESTALT:
      return "Описание школы Гештальт"
    case PSY_SCHOOLS.SCHIZOPHRENIA:
    default:
      return ""
  }
}
