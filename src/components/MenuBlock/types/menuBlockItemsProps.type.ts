import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { MenuBlockOptions } from "./menuBlockOptions.type"

export type MenuBlockItemsProps = {
  key?: string
  name: string
  descr: string
  roles?: Array<ROLES>
  items: Array<MenuBlockItemsProps>
  conversation?: CONVERSATION_NAMES
  options?: Partial<MenuBlockOptions>
}
