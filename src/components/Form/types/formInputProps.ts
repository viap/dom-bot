import { FromInputValue } from "./formInputValue"
import { FORM_INPUT_TYPES } from "../enums/formInputTypes"

export type FormInputProps = {
  name: string
  type: FORM_INPUT_TYPES
  optional?: boolean
  values?: Array<FromInputValue>
  default?: FromInputValue
  alias?: string
  owner?: string
}
