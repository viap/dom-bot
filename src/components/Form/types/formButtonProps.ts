import { Conversation } from "@grammyjs/conversations"
import { MyContext } from "../../../common/types/myContext"
import { FORM_BUTTON_ACTIONS } from "../enums/formButtonActions"

export type FormButtonProps = {
  text: string
  action: FORM_BUTTON_ACTIONS
  callback?: (
    conversation: Conversation<MyContext>,
    ctx: MyContext
  ) => void | Promise<void>
}
