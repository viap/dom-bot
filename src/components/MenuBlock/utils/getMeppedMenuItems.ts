import menuItemsList from "../consts/menuItemsList"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export default function getMeppedMenuItems(): {
  [key: string]: Partial<MenuBlockItemsProps>
} {
  const mapped: {
    [key: string]: Partial<MenuBlockItemsProps> & Required<{ key: string }>
  } = {}

  menuItemsList.forEach((item) => {
    mapped[item.key] = item
  })

  return mapped
}
