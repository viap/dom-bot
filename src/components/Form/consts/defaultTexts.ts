import { ReplyMarkup } from "../../../common/utils/replyMarkup"
import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { FormInputProps } from "../types/formInputProps"
import { notEmpty } from "../../../common/utils/notEmpty"
import { FORM_INPUT_TYPES } from "../enums/formInputTypes"

export const defaultTexts = {
  beforeInput: (
    _data: ObjectWithPrimitiveValues,
    input: FormInputProps,
    inputIndex?: number,
    inputsLength?: number
  ) => {
    const content: Array<string> = []

    if (
      typeof inputIndex === "number" &&
      typeof inputsLength === "number" &&
      inputIndex >= 0 &&
      inputIndex < inputsLength
    ) {
      content.push(
        `*${ReplyMarkup.escapeForParseModeV2(
          `${inputIndex + 1}/${inputsLength} |`
        )}*${ReplyMarkup.space}`
      )
    }
    content.push(
      (input.values && input.values.length) ||
        input.type === FORM_INPUT_TYPES.DATE
        ? "Выберите"
        : "Введите"
    )
    content.push(
      ReplyMarkup.space +
        `*${ReplyMarkup.escapeForParseModeV2(
          input.alias || input.name
        ).toUpperCase()}*`
    )
    content.push(
      input.owner
        ? ReplyMarkup.space +
            `для *${ReplyMarkup.escapeForParseModeV2(
              input.owner.toUpperCase()
            )}*`
        : ""
    )

    const defaultValue = input.default ? input.default.toString() : ""
    if (defaultValue) {
      content.push(
        ReplyMarkup.escapeForParseModeV2(`, по-умолчанию `) +
          `*${ReplyMarkup.escapeForParseModeV2(defaultValue)}*`
      )
    }

    content.push(input.optional ? ReplyMarkup.space + "или пропустите " : "")

    return content.filter(notEmpty).join("")
  },
}
