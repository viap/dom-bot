import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { SUBMENU_TYPES } from "../enums/submenuTypes.enum"
import { MenuBlockOptions } from "./menuBlockOptions.type"

export type MenuBlockItemsProps = {
  key: string
  name: string
  parent?: MenuBlockItemsProps
  roles?: Array<ROLES>

  content?: string | ((...props: Array<unknown>) => string)
  items?: Array<MenuBlockItemsProps>
  options?: Partial<MenuBlockOptions>

  submenuPreload?: boolean
  submenu?: SUBMENU_TYPES

  conversation?: CONVERSATION_NAMES
  props?: Array<unknown>
}
