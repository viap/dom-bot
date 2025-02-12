import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { MenuBlockItemsProps } from "@/components/MenuBlock/types/menuBlockItemsProps"

export type ConversationResult = {
  stepsBack?: number
  // ---
  goTo?: MENU_ITEM_TYPES | string
  goToFromTheTop?: boolean
  goToDirection?: "up" | "down"
  // ---
  parent?: MenuBlockItemsProps
  current?: MenuBlockItemsProps
  parentProps?: Array<unknown>
  currentProps?: Array<unknown>
}
