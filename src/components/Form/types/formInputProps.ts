import { FORM_INPUT_TYPES } from "../enums/formInputTypes"
import { FromInputValue } from "./formInputValue"
import { CalendarOptions } from "telegram-inline-calendar"
import { MyContext } from "@/common/types/myContext"

type BaseFormInputProps = {
  name: string
  optional?: boolean
  values?: Array<FromInputValue>
  default?: FromInputValue
  alias?: string
  owner?: string
}

export type FormInputProps =
  | (BaseFormInputProps & {
      type: Exclude<FORM_INPUT_TYPES, FORM_INPUT_TYPES.DATE>
      // Runs only after a non-button text message has been accepted as input.
      onTextMessage?: (ctx: MyContext) => void | Promise<void>
    })
  | (BaseFormInputProps & {
      type: FORM_INPUT_TYPES.DATE
      calendarOptions?: CalendarOptions
    })
