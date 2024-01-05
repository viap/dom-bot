import { Conversation } from "@grammyjs/conversations"
import MenuBlock from "../../components/MenuBlock/menuBlock"

import { MyContext } from "../../common/types/myContext"
import defaultMenu from "../../components/MenuBlock/consts/defaultMenu"
import { CONVERSATION_ERRORS } from "../enums/conversationErrors"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"

import { BotConversations } from "../index"

async function checkAgreemensts(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<boolean> {
  conversation.log("checkAgreemensts", conversation.session.hasTermsAgreement)

  // ask for agreement if it is not get yet
  if (!conversation.session.hasTermsAgreement) {
    const termsComversation = BotConversations.getByName(
      CONVERSATION_NAMES.TERMS_AGREEMENT
    )

    if (termsComversation) {
      conversation.log("checkAgreemensts:", termsComversation)
      return !!(await termsComversation.getConversation()(conversation, ctx))
    }
  }

  return conversation.session.hasTermsAgreement
}

const menuItemSelect: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.SELECT_MENU_ITEM
  },

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      if (!(await checkAgreemensts(conversation, ctx))) {
        return
      }

      const menu = defaultMenu
        ? new MenuBlock(conversation, ctx, defaultMenu)
        : undefined

      if (!menu) {
        await ctx.reply(CONVERSATION_ERRORS.EMPTY_MENU)
        return
      }

      await menu.show()
    }
  },
}

export default menuItemSelect
