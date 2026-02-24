import { createNotification } from "@/api/controllerNotifications/createNotification"
import { ROLES_DESCR_PLURAL } from "@/common/consts/rolesDescr"
import { ClientDto } from "@/common/dto/client.dto"
import { NotificationDto } from "@/common/dto/notification.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { ROLES } from "@/common/enums/roles"
import { getTextOfNotification } from "@/common/texts/getTextOfNotification"
import { MyContext } from "@/common/types/myContext"
import { getDateFromRuDateString } from "@/common/utils/getDateFromRuDateString"
import { notEmpty } from "@/common/utils/notEmpty"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { createForm } from "@/components/Form/form"
import { Conversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const notificationCreate: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.NOTIFICATIONS
  },

  getConversation(_client: ClientDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined | unknown> => {
      // NOTICE: don't use conversation.now inside of conversation.external
      const now = await conversation.now()

      const inputs = [
        {
          name: "roles",
          alias: "Получателей",
          type: FORM_INPUT_TYPES.SELECT,
          values: Array.from(ROLES_DESCR_PLURAL.entries()).map(
            ([value, text]) => ({
              value,
              text,
            })
          ),
          default: ROLES_DESCR_PLURAL.get(ROLES.PSYCHOLOGIST),
        },
        {
          name: "title",
          alias: "Заголовок",
          type: FORM_INPUT_TYPES.STRING,
          optional: true,
        },
        {
          name: "message",
          alias: "Текст сообщение",
          type: FORM_INPUT_TYPES.STRING,
        },
        {
          name: "startsAt",
          alias: "Дата отправки",
          type: FORM_INPUT_TYPES.DATE,
          calendarOptions: {
            start_date: "now",
          },
          optional: true,
        },
        // {
        //   name: "finishAt",
        //   alias: "Дата окончания",
        //   type: FORM_INPUT_TYPES.DATE,
        //   default: getLocalDateString(now),
        //   calendarOptions: {
        //     start_date: "now",
        //   },
        //   optional: true,
        // },
      ] as const

      const form = createForm(conversation, ctx, inputs)
      const formResult = await form.requestData()

      let result = false
      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let notification: NotificationDto | false = false
        try {
          notification = await conversation.external(async () => {
            return createNotification(ctx, {
              startsAt: formResult.data.startsAt
                ? getDateFromRuDateString(formResult.data.startsAt).getTime()
                : undefined,
              finishAt: undefined,
              roles: [formResult.data.roles as ROLES],
              title: formResult.data.title,
              message: formResult.data.message,
              type: NOTIFICATION_TYPES.MESSAGE,
            })
          })

          result = notEmpty(notification)
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
            await ctx.reply("*Добавлено уведомление*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось добавить уведомление*",
              ReplyMarkup.parseModeV2
            )
          }
        }

        if (notification) {
          await ctx.reply(
            getTextOfNotification(notification),
            ReplyMarkup.parseModeV2
          )
        }
      }

      return result
        ? {
            stepsBack: 2,
          }
        : undefined
    }
  },
}

export default notificationCreate
