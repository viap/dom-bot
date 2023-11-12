import defaultMenu from "../consts/defaultMenu"
import MENU_ITEM_TYPES from "../enums/menuItemTypes.enum"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export default function getMenuItemBreadCrumbs(
  itemType: MENU_ITEM_TYPES,
  menu: PartialMenuBlockItemsProps = defaultMenu
): Array<string> | undefined {
  const result: Array<string> = [menu.name || ""]

  if (menu.key === itemType) {
    return result
  } else if (menu.items?.length) {
    const menuItemBreadCrumbs = menu.items
      .map((item) => {
        return getMenuItemBreadCrumbs(itemType, item)
      })
      .find((path) => path?.length)

    if (menuItemBreadCrumbs) {
      result.push(...menuItemBreadCrumbs)
      return result
    }
  }

  return undefined
}
