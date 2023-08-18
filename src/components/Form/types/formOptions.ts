import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { FORM_TEXT_TYPES } from "../enums/formTextTypes.enum"
import { FormInputProps } from "../types/formInputProps"

export type FormOptions = {
  texts?: {
    [FORM_TEXT_TYPES.BEFORE_INPUT]?:
      | ((data: ObjectWithPrimitiveValues, input: FormInputProps) => string)
      | string
    [FORM_TEXT_TYPES.AFTER_INPUT]?:
      | ((data: ObjectWithPrimitiveValues, input: FormInputProps) => string)
      | string
    [FORM_TEXT_TYPES.AFTER_REJECT]?:
      | ((data: ObjectWithPrimitiveValues) => string)
      | string
  }
}
