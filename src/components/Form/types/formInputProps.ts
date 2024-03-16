import { FromInputValue } from "./formInputValue"
import { FORM_INPUT_TYPES } from "../enums/formInputTypes"
import { CalendarOptions } from "telegram-inline-calendar"

export type FormInputProps = {
  name: string
  optional?: boolean
  values?: Array<FromInputValue>
  default?: FromInputValue
  alias?: string
  owner?: string
} & (
  | { type: Exclude<FORM_INPUT_TYPES, FORM_INPUT_TYPES.DATE> }
  | {
      type: FORM_INPUT_TYPES.DATE
      calendarOptions?: CalendarOptions
    }
)
