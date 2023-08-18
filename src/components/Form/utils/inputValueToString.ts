import { FromInputValue } from "../types/formInputValue"

export function inputValueToString(value: FromInputValue) {
  return typeof value === "object" ? value.text : value.toString()
}
