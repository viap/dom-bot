import { Psychologist } from "../../types/index"
import { PSY_SCHOOLS } from "../Quiz/consts"

export const psychologists: Array<Psychologist<PSY_SCHOOLS>> = [
  {
    schools: [PSY_SCHOOLS.EXISTENSE],
    name: "Алёна Чалова",
    descr: "Кандидат психологических наук и бла, бла, бла ...",
    photo: "",
    contacts: {
      telegram: "",
    },
  },
  {
    schools: [PSY_SCHOOLS.ANALYZE],
    name: "Виктор Заикин",
    descr: "Кандидат психологических наук и бла, бла, бла ...",
    photo: "",
    contacts: {
      telegram: "",
    },
  },
]
