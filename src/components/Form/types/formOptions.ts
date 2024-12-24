import { ObjectWithPrimitiveValues } from "@/common/types/objectWithPrimitiveValues"
import { FormInputProps } from "./formInputProps"
import { FORM_TEXT_TYPES } from "../enums/formTextTypes"

export type FormOptions = {
  texts?: {
    [FORM_TEXT_TYPES.BEFORE_INPUT]?:
      | ((
          data: ObjectWithPrimitiveValues,
          input: FormInputProps,
          inputIndex?: number,
          inputsLength?: number
        ) => string)
      | string
    [FORM_TEXT_TYPES.AFTER_INPUT]?:
      | ((
          data: ObjectWithPrimitiveValues,
          input: FormInputProps,
          inputIndex?: number,
          inputsLength?: number
        ) => string)
      | string
    [FORM_TEXT_TYPES.AFTER_REJECT]?:
      | ((
          data: ObjectWithPrimitiveValues,
          inputIndex?: number,
          inputsLength?: number
        ) => string)
      | string
  }
}
