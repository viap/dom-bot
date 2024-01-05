import { PSY_SCHOOLS } from "../enums/psySchools"

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
