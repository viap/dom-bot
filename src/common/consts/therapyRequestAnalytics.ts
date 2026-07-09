import {
  THERAPY_REQUEST_CATEGORY,
  THERAPY_REQUEST_CLIENT_GENDER,
} from "@/common/enums/therapyRequestAnalytics"

export const clientGenderLabels: Record<
  THERAPY_REQUEST_CLIENT_GENDER,
  string
> = {
  [THERAPY_REQUEST_CLIENT_GENDER.FEMALE]: "женщина",
  [THERAPY_REQUEST_CLIENT_GENDER.MALE]: "мужчина",
  [THERAPY_REQUEST_CLIENT_GENDER.OTHER]: "другое",
  [THERAPY_REQUEST_CLIENT_GENDER.UNKNOWN]: "неизвестно",
}

export const requestCategoryLabels: Record<THERAPY_REQUEST_CATEGORY, string> = {
  [THERAPY_REQUEST_CATEGORY.INDIVIDUAL]: "индивидуальная терапия",
  [THERAPY_REQUEST_CATEGORY.FAMILY]: "семейная или парная терапия",
  [THERAPY_REQUEST_CATEGORY.GROUP]: "групповая терапия",
  [THERAPY_REQUEST_CATEGORY.CHILD]: "детский или подростковый запрос",
  [THERAPY_REQUEST_CATEGORY.UNKNOWN]: "неизвестно",
}

export const clientGenderOptions: Array<{
  text: string
  value: THERAPY_REQUEST_CLIENT_GENDER
}> = [
  { text: "Женщина", value: THERAPY_REQUEST_CLIENT_GENDER.FEMALE },
  { text: "Мужчина", value: THERAPY_REQUEST_CLIENT_GENDER.MALE },
  { text: "Другое", value: THERAPY_REQUEST_CLIENT_GENDER.OTHER },
  { text: "Неизвестно", value: THERAPY_REQUEST_CLIENT_GENDER.UNKNOWN },
]

export const requestCategoryOptions: Array<{
  text: string
  value: THERAPY_REQUEST_CATEGORY
}> = [
  {
    text: "Индивидуальная терапия",
    value: THERAPY_REQUEST_CATEGORY.INDIVIDUAL,
  },
  {
    text: "Семейная или парная терапия",
    value: THERAPY_REQUEST_CATEGORY.FAMILY,
  },
  { text: "Групповая терапия", value: THERAPY_REQUEST_CATEGORY.GROUP },
  {
    text: "Детский или подростковый запрос",
    value: THERAPY_REQUEST_CATEGORY.CHILD,
  },
  { text: "Неизвестно", value: THERAPY_REQUEST_CATEGORY.UNKNOWN },
]

export function isTherapyRequestClientGender(
  value: unknown
): value is THERAPY_REQUEST_CLIENT_GENDER {
  return clientGenderOptions.some((option) => option.value === value)
}

export function isTherapyRequestCategory(
  value: unknown
): value is THERAPY_REQUEST_CATEGORY {
  return requestCategoryOptions.some((option) => option.value === value)
}
