import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"

export type MenuBlockItemsProps = {
  // _id: mongoose.Types.ObjectId
  key?: string
  name: string
  descr: string
  roles?: Array<ROLES>
  items: Array<MenuBlockItemsProps>
  conversation?: CONVERSATION_NAMES
}
