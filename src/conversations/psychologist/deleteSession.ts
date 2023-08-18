import { Conversation } from "@grammyjs/conversations"
import { deleteTherapySession } from "../../api/deleteTherapySession"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

export const DeleteSession: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.MY_CLIENT_DELETE_SESSION
  },

  getConversation(client: ClientDto, session: TherapySessionDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = await conversation.external(async () => {
          return await deleteTherapySession(ctx, session._id)
        })
        // result = await deleteTherapySession(ctx, session)
      } catch {
        result = false
      }

      if (result) {
        await ctx.reply("*Сессия удалена*", ReplyMarkup.parseModeV2)

        return {
          goTo: "Клиенты",
          goToFromTheTop: true,
        }
      } else {
        await ctx.reply("*Сессию удалить не удалось*", ReplyMarkup.parseModeV2)
      }
    }
  },
}
