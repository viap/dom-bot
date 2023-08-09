import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { MenuBlockOptions } from "./menuBlockOptions.type"
import { MENU_DATA_TYPES } from "../enums/menuDataTypes.enum"

export type MenuBlockItemsProps = {
  key?: string
  name: string
  descr: string
  roles?: Array<ROLES>
  options?: Partial<MenuBlockOptions>
  //
  from?: MENU_DATA_TYPES
  items?: Array<MenuBlockItemsProps>
  conversation?: CONVERSATION_NAMES
  conversationProps?: Array<any>
}