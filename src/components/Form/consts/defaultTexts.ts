import { ReplyMarkup } from "../../../common/utils/replyMarkup"
import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { FormInputProps } from "../types/formInputProps"
import { notEmpty } from "../../../common/utils/notEmpty"

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
    content.push(input.values && input.values.length ? "Выберите" : "Введите")
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
    content.push(
      input.default
        ? ReplyMarkup.escapeForParseModeV2(`, по-умолчанию `) +
            `*${input.default}*`
        : ""
    )
    content.push(input.optional ? ReplyMarkup.space + "или пропустите " : "")

    return content.filter(notEmpty).join("")
  },
}
