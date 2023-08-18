import { MenuBlockItemsProps } from "../../components/MenuBlock/types/menuBlockItemsProps.type"

export type ConversationResult = {
  goTo?: string
  goToFromTheTop?: boolean
  parent?: MenuBlockItemsProps
  current?: MenuBlockItemsProps
  parentProps?: Array<unknown>
  currentProps?: Array<unknown>
}
