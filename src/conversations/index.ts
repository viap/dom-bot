import { createConversation } from "@grammyjs/conversations"
import { AddClient } from "./psychologist/addClient"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { AddTherapySession } from "./psychologist/addTherapySession"
import { DeleteTherapySession } from "./psychologist/deleteTherapySession"
import { EditClient } from "./psychologist/editClient"
import { DeleteClient } from "./psychologist/deleteClient"
// import { QuizProgress } from "./quizProgress"
import { MiddlewareFn } from "grammy"
import { MyContext } from "../common/types/myContext"
import { SelectMenuItem } from "./selectMenuItem"
import { SelectQiuz } from "./selectQuiz"
import { Terms } from "./terms"
import { BotConversation } from "./types/botConversation"

export const BotConversations = {
  getList(): Array<BotConversation> {
    return [
      Terms,
      AddClient,
      SelectQiuz,
      SelectMenuItem,
      EditClient,
      DeleteClient,
      AddTherapySession,
      DeleteTherapySession,
    ]
  },

  getByName(name: CONVERSATION_NAMES): BotConversation | undefined {
    return this.getList().find((botConversation) => {
      return botConversation.getName() === name
    })
  },

  getMiddlewareByName(name: CONVERSATION_NAMES): MiddlewareFn<MyContext> {
    const conversation = this.getByName(name)

    if (conversation) {
      return this.getMiddleware(conversation)
    } else {
      return (ctx, next) => next()
    }
  },

  getMiddleware(conversation: BotConversation): MiddlewareFn<MyContext> {
    if (conversation.contextPreload) {
      return async (ctx, next) => {
        const props = conversation.contextPreload
          ? await conversation.contextPreload(ctx)
          : []

        return createConversation(
          conversation.getConversation(...props),
          conversation.getName()
        )(ctx, next)
      }
    } else {
      return createConversation(
        conversation.getConversation(),
        conversation.getName()
      )
    }
  },

  listOfMiddlewares(
    others?: Array<BotConversation>
  ): Array<MiddlewareFn<MyContext>> {
    const list = others || [...this.getList()]
    const result: Array<MiddlewareFn<MyContext>> = []

    const conversation = list.shift()

    if (conversation) {
      result.push(this.getMiddleware(conversation))

      if (list.length) {
        result.push(...this.listOfMiddlewares(list))
      }
    }

    return result
  },
}
