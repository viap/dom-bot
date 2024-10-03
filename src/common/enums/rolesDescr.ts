import { ROLES } from "./roles"

export const ROLES_DESCR = new Map<ROLES, string>([
  [ROLES.USER, "пользователь"],
  [ROLES.ADMIN, "администратор"],
  [ROLES.EDITOR, "редактор"],
  [ROLES.ACCOUNTANT, "бухгалтер"],
  [ROLES.PSYCHOLOGIST, "психолог"],
])
