import { Conversation } from "@grammyjs/conversations"
import { FORM_BUTTON_ACTIONS } from "../enums/formButtonActions"
import { MyContext } from "@/common/types/myContext"

export type FormButtonProps = {
  text: string
  action: FORM_BUTTON_ACTIONS
  callback?: (
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) => void | Promise<void>
}
