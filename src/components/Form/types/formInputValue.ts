import { PrimitiveValues } from "../../../common/types/primitiveValues"
export type FromInputValue =
  | PrimitiveValues
  | { text: string; value: PrimitiveValues }
