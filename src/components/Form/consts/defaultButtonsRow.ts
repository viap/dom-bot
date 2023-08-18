import { ACTION_BUTTON_TEXTS } from "../../../common/enums/actionButtonTexts.enum"
import { FORM_BUTTON_ACTIONS } from "../enums/formButtonActions.enum"

export const defaultButtonsRow = [
  [
    {
      text: ACTION_BUTTON_TEXTS.PREV,
      action: FORM_BUTTON_ACTIONS.PREV,
      // callback: async (conversation: Conversation<MyContext>) => {
      //   conversation.log("Нажали назад")
      // },
    },
    {
      text: ACTION_BUTTON_TEXTS.NEXT,
      action: FORM_BUTTON_ACTIONS.NEXT,
      // callback: async (conversation: Conversation<MyContext>) => {
      //   conversation.log("Нажали вперед")
      // },
    },
    {
      text: ACTION_BUTTON_TEXTS.REJECT,
      action: FORM_BUTTON_ACTIONS.REJECT,
      // callback: async (conversation: Conversation<MyContext>) => {
      //   conversation.log("Нажали отмена")
      // },
    },
  ],
]
