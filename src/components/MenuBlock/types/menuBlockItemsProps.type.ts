import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { SUBMENU_TYPES } from "../enums/submenuTypes.enum"
import { MenuBlockOptions } from "./menuBlockOptions.type"

export type MenuBlockItemsProps = {
  name: string
  content?: string | ((...props: Array<unknown>) => string)
  roles?: Array<ROLES>
  options?: Partial<MenuBlockOptions>
  items?: Array<MenuBlockItemsProps>
  submenu?: SUBMENU_TYPES
  conversation?: CONVERSATION_NAMES
  conversationProps?: Array<unknown>
}
