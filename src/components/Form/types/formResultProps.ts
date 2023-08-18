import { FORM_RESULT_STATUSES } from "../enums/formResultStatuses.enum"

export type FormResultProps<T> =
  | {
      status: FORM_RESULT_STATUSES.FINISHED
      data: T
    }
  | {
      status: FORM_RESULT_STATUSES.IN_PROGRESS | FORM_RESULT_STATUSES.REJECTED
      data: Partial<T>
    }
