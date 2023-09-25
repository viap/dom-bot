import { PrimitiveValues } from "common/types/primitiveValues"

export function getValueByKey(
  type: { [keyL: string]: PrimitiveValues },
  value: string
) {
  return Object.entries(type).find(([key]) => key === value)?.[1]
}
