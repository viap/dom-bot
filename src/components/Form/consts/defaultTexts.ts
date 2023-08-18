import { ReplyMarkup } from "../../../common/utils/replyMarkup"
import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { FormInputProps } from "../types/formInputProps"

export const defaultTexts = {
  beforeInput: (_data: ObjectWithPrimitiveValues, input: FormInputProps) => {
    return `Введите *${ReplyMarkup.escapeForParseModeV2(
      input.alias || input.name
    )}* ${
      input.owner
        ? `для *${ReplyMarkup.escapeForParseModeV2(input.owner)}*`
        : ""
    }`
  },
}