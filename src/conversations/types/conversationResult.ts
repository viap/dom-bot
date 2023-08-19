import { MenuBlockItemsProps } from "../../components/MenuBlock/types/menuBlockItemsProps.type"

export type ConversationResult = {
  stepsBack?: number
  // ---
  goTo?: string
  goToFromTheTop?: boolean
  goToDirection?: "up" | "down"
  // ---
  parent?: MenuBlockItemsProps
  current?: MenuBlockItemsProps
  parentProps?: Array<unknown>
  currentProps?: Array<unknown>
}
