import { ROLES } from "@/common/enums/roles"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { MenuBlockOptions } from "./menuBlockOptions"
import { SUBMENU_TYPES } from "../enums/submenuTypes"

export type MenuBlockItemsProps = {
  key: string
  name: string
  parent?: MenuBlockItemsProps
  roles?: Array<ROLES>

  content?: string | ((...props: Array<unknown>) => string)
  items?: Array<MenuBlockItemsProps>
  options?: Partial<MenuBlockOptions>

  submenuPreloaded?: boolean
  submenu?: SUBMENU_TYPES

  conversation?: CONVERSATION_NAMES
  props?: Array<unknown>
}

export type PartialMenuBlockItemsProps = Partial<
  Omit<MenuBlockItemsProps, "parent" | "items">
> &
  Partial<{
    parent: PartialMenuBlockItemsProps
    items: Array<PartialMenuBlockItemsProps>
  }>
