import { createConversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "./enums/conversationNames.enum"
import { CreatePsychologistFromUser } from "./roleEditor/createPsychologistFromUser"
import { DeleteTherapyRequest } from "./roleEditor/deleteTherapyRequest"
import EditTherapyRequest from "./roleEditor/editTherapyRequest"
import { EditUser } from "./roleEditor/editUser"
import { RemoveFromPsychologists } from "./roleEditor/removeFromPsychologists"
import { AcceptTherapyRequest } from "./rolePsychologist/acceptTherapyRequest"
import { AddClient } from "./rolePsychologist/addClient"
import { AddTherapySession } from "./rolePsychologist/addTherapySession"
import { DeleteClient } from "./rolePsychologist/deleteClient"
import { DeleteTherapySession } from "./rolePsychologist/deleteTherapySession"
import { EditClient } from "./rolePsychologist/editClient"
import { RejectTherapyRequest } from "./rolePsychologist/rejectTherapyRequest"
import { TransferTherapyRequest } from "./rolePsychologist/transferTherapyRequest"
import { AddTherapyRequest } from "./roleUser/addTherapyRequest"
// import { QuizProgress } from "./quizProgress"
import { MyContext } from "common/types/myContext"
import { MiddlewareFn } from "grammy"
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
      EditUser,
      CreatePsychologistFromUser,
      DeleteTherapyRequest,
      TransferTherapyRequest,
      EditTherapyRequest,
      AcceptTherapyRequest,
      RejectTherapyRequest,
      RemoveFromPsychologists,
      DeleteClient,
      AddTherapySession,
      DeleteTherapySession,
      AddTherapyRequest,
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
