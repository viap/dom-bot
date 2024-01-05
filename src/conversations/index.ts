import { createConversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "./enums/conversationNames"
import { MyContext } from "common/types/myContext"
import { MiddlewareFn } from "grammy"
import { BotConversation } from "./types/botConversation"

//USERS
import userEdit from "./users/edit"
import userToPsychologist from "./users/toPsychologist"
//PSYCHOLOGISTS
import psychologistsToUser from "./psychologists/toUser"
//CLIENTS
import clientAdd from "./clients/add"
import clientDelete from "./clients/delete"
import clientEdit from "./clients/edit"
//THERAPY_REQUESTS
import therapyRequestDelete from "./therapyRequests/delete"
import therapyRequestEdit from "./therapyRequests/edit"
import therapyRequestAccept from "./therapyRequests/accept"
import therapyRequestReject from "./therapyRequests/reject"
import therapyRequestTransfer from "./therapyRequests/transfer"
import therapyRequestAdd from "./therapyRequests/add"
//THERAPY_SESSIONS
import therapySessionAdd from "./therapySessions/add"
import therapySessionDelete from "./therapySessions/delete"
import therapySessionShow from "./therapySessions/show"
import therapySessionsStatistic from "./therapySessions/statistic"
//OTHERS
import menuItemSelect from "./others/selectMenuItem"
import qiuzSelect from "./others/selectQuiz"
import termsAgreementShow from "./others/termsAgreement"
// import { QuizProgress } from "./quizProgress"

export const BotConversations = {
  getList(): Array<BotConversation> {
    return [
      termsAgreementShow,
      qiuzSelect,
      menuItemSelect,

      userEdit,
      userToPsychologist,

      psychologistsToUser,

      clientAdd,
      clientEdit,
      clientDelete,

      therapyRequestAdd,
      therapyRequestAccept,
      therapyRequestDelete,
      therapyRequestEdit,
      therapyRequestReject,
      therapyRequestTransfer,

      therapySessionAdd,
      therapySessionDelete,
      therapySessionShow,
      therapySessionsStatistic,
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
      return (_ctx, next) => next()
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
