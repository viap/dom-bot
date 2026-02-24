import { FORM_RESULT_STATUSES } from "../enums/formResultStatuses"
import { FormInputProps } from "./formInputProps"
import { InferFormResultSimple } from "./inferFormResult"

export type FormResultProps<T extends readonly FormInputProps[]> =
  | {
      status: FORM_RESULT_STATUSES.FINISHED
      data: InferFormResultSimple<T>
    }
  | {
      status: FORM_RESULT_STATUSES.IN_PROGRESS | FORM_RESULT_STATUSES.REJECTED
      data: Partial<InferFormResultSimple<T>>
    }
