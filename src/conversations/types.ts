import { MyContext } from "@/common/types/myContext"
import { ConversationFn } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "./enums/conversationNames"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { MenuBlockItemsProps } from "@/components/MenuBlock/types/menuBlockItemsProps"

export type BotConversation = {
  contextPreload?(ctx: MyContext): Promise<Array<unknown> | never>
  getName(): CONVERSATION_NAMES
  getConversation(...props: Array<unknown>): ConversationFn<MyContext>
}

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
