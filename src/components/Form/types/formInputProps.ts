import { FromInputValue } from "./formInputValue"
import { FORM_INPUT_TYPES } from "../enums/formInputTypes.enum"

export type FormInputProps = {
  name: string
  type: FORM_INPUT_TYPES
  default?: string
  optional?: boolean
  values?: Array<FromInputValue>
  alias?: string
  owner?: string
}
