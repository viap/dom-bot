import { MyContext } from "@/common/types/myContext"
import { createConversation } from "@grammyjs/conversations"
import { MiddlewareFn } from "grammy"
import { CONVERSATION_NAMES } from "./enums/conversationNames"
import { BotConversation } from "./types/botConversation"

//USERS
import userAddRole from "./users/addRole"
import userEdit from "./users/edit"
import userRemoveRole from "./users/removeRole"
import userToPsychologist from "./users/toPsychologist"
//CLIENTS
import clientAdd from "./clients/add"
import clientDelete from "./clients/delete"
import clientEdit from "./clients/edit"
//THERAPY_REQUESTS
import therapyRequestAccept from "./therapyRequests/accept"
import therapyRequestAdd from "./therapyRequests/add"
import therapyRequestDelete from "./therapyRequests/delete"
import therapyRequestEdit from "./therapyRequests/edit"
import therapyRequestReject from "./therapyRequests/reject"
import therapyRequestTransfer from "./therapyRequests/transfer"
//THERAPY_SESSIONS
import therapySessionAdd from "./therapySessions/add"
import therapySessionDelete from "./therapySessions/delete"
import therapySessionsGeneralStatistic from "./therapySessions/generalStatistic"
import therapySessionsPresonalStatistic from "./therapySessions/personalStatistic"
import therapySessionShow from "./therapySessions/show"
//NOTIFICATIONS
import notificationCreate from "./notifications/create"
//OTHERS
import requisitesShow from "./others/requisites"
import menuItemSelect from "./others/selectMenuItem"
import qiuzSelect from "./others/selectQuiz"
import termsAgreementShow from "./others/termsAgreement"
// import { QuizProgress } from "./quizProgress"

export const BotConversations = {
  getList(): Array<BotConversation> {
    return [
      termsAgreementShow,
      requisitesShow,
      qiuzSelect,
      menuItemSelect,

      notificationCreate,

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
