import { ACTION_BUTTON_TEXTS } from "@/common/enums/actionButtonTexts"
import { MenuBlockItemsParams } from "../types/menuBlockItemsParams"

export function getPrevButtonText({
  pageNumber,
}: MenuBlockItemsParams): string {
  const withPostfix = pageNumber > 0

  if (!withPostfix) {
    return ACTION_BUTTON_TEXTS.PREV
  }

  return `${ACTION_BUTTON_TEXTS.PREV} ${pageNumber}`
}

export function getNextButtonText({
  pageNumber,
  pagesCount,
}: MenuBlockItemsParams): string {
  const withPrefix = pageNumber < pagesCount - 1

  if (!withPrefix) {
    return ACTION_BUTTON_TEXTS.NEXT
  }

  const nextPageNumber = pageNumber + 1
  const prefix =
    pagesCount - nextPageNumber >= 2
      ? `[${nextPageNumber + 1}..${pagesCount}]`
      : nextPageNumber + 1

  return `${prefix} ${ACTION_BUTTON_TEXTS.NEXT}`
}
