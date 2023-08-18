import { Conversation } from "@grammyjs/conversations"
import { deleteClient } from "../../api/deleteClient"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

export const DeleteClient: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.CLIENT_DELETE
  },

  getConversation(client: ClientDto, sessions: Array<TherapySessionDto>) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = await conversation.external(async () => {
          return await deleteClient(ctx, client.user._id)
        })
      } catch {
        result = false
      }

      if (result) {
        await ctx.reply("*Клиент удален*", ReplyMarkup.parseModeV2)

        return {
          goTo: "Клиенты",
          goToFromTheTop: true,
        }
      } else {
        await ctx.reply("*Клиента удалить не удалось*", ReplyMarkup.parseModeV2)
      }
    }
  },
}
