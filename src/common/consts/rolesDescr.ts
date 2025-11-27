import { ROLES } from "../enums/roles"

export const ROLES_DESCR = new Map<ROLES, string>([
  [ROLES.USER, "пользователь"],
  [ROLES.ADMIN, "администратор"],
  [ROLES.EDITOR, "редактор"],
  [ROLES.ACCOUNTANT, "бухгалтер"],
  [ROLES.PSYCHOLOGIST, "психолог"],
])

// Plural form translations for roles
export const ROLES_DESCR_PLURAL = new Map<ROLES, string>([
  [ROLES.USER, "пользователи"],
  [ROLES.ADMIN, "администраторы"],
  [ROLES.EDITOR, "редакторы"],
  [ROLES.ACCOUNTANT, "бухгалтеры"],
  [ROLES.PSYCHOLOGIST, "психологи"],
])
