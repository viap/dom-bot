import { createConversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "./enums/conversationNames"
import { MyContext } from "@/common/types/myContext"
import { MiddlewareFn } from "grammy"
import { BotConversation } from "./types"

//USERS
import userEdit from "./users/edit"
import userAddRole from "./users/addRole"
import userRemoveRole from "./users/removeRole"
import userToPsychologist from "./users/toPsychologist"
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
import therapySessionsPresonalStatistic from "./therapySessions/personalStatistic"
import therapySessionsGeneralStatistic from "./therapySessions/generalStatistic"
//OTHERS
import menuItemSelect from "./others/selectMenuItem"
import qiuzSelect from "./others/selectQuiz"
import termsAgreementShow from "./others/termsAgreement"
import requisitesShow from "./others/requisites"
// import { QuizProgress } from "./quizProgress"

export const BotConversations = {
  getList(): Array<BotConversation> {
    return [
      termsAgreementShow,
      requisitesShow,
      qiuzSelect,
      menuItemSelect,

      userEdit,
      userAddRole,
      userRemoveRole,
      userToPsychologist,

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
      therapySessionsPresonalStatistic,
      therapySessionsGeneralStatistic,
    ]
  },

  getByName(name: CONVERSATION_NAMES): BotConversation | undefined {
    return this.getList().find((botConversation) => {
      return botConversation.getName() === name
    })
  },

  getMiddlewareByName(
    name: CONVERSATION_NAMES,
    props: Array<unknown> = []
  ): MiddlewareFn<MyContext> {
    const conversation = this.getByName(name)

    if (conversation) {
      return this.getMiddleware(conversation, props)
    } else {
      return (_ctx, next) => next()
    }
  },

  getMiddleware(
    conversation: BotConversation,
    props: Array<unknown> = []
  ): MiddlewareFn<MyContext> {
    if (conversation.contextPreload) {
      return async (ctx, next) => {
        const preloadedProps = conversation.contextPreload
          ? await conversation.contextPreload(ctx)
          : props

        return createConversation(
          conversation.getConversation(...preloadedProps),
          conversation.getName()
        )(ctx, next)
      }
    } else {
      const conv = createConversation(
        conversation.getConversation(...props),
        conversation.getName()
      )

      return conv
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
