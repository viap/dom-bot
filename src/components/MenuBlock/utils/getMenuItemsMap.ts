import menuItemsList from "../consts/menuItemsList"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps"

export default function getMenuItemsMap(): {
  [key: string]: PartialMenuBlockItemsProps
} {
  const map: {
    [key: string]: PartialMenuBlockItemsProps & Required<{ key: string }>
  } = {}

  menuItemsList.forEach((item) => {
    map[item.key] = item
  })

  return map
}
