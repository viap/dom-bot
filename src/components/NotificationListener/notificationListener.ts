import { Api, Bot, InlineKeyboard, RawApi } from "grammy"
import { io, Socket } from "socket.io-client"
import { NotificationDto } from "../../common/dto/notification.dto"
import NotificationTypes from "../../common/enums/notificationTypes"
import { MyContext } from "../../common/types/myContext"
import MENU_ITEM_TYPES from "../../components/MenuBlock/enums/menuItemTypes.enum"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import getMenuItemBreadCrumbs from "../../components/MenuBlock/utils/getMenuItemBreadCrumbs"
import { getApiClientHeader } from "../../common/utils/getApiClientHeader"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import { Collection } from "@grammyjs/storage-mongodb/dist/cjs/deps.node"
import { SessionData } from "../../common/types/sessionData"
import { jwtDecode } from "jwt-decode"
import { TokenPayloadDto } from "../../common/dto/tokenPayload.dto"

type NotificationRecipient = { chatId: string; token: string }

export default class NotificationListener {
  private static bot: Bot<MyContext, Api<RawApi>>
  private static sessions: Collection<MongoStorage.ISession>

  private static socket: Socket | undefined
  private static isConnected: boolean
  private static pollingInterval: NodeJS.Timeout | undefined
  private static polingDelay: number

  static async start(
    bot: Bot<MyContext, Api<RawApi>>,
    sessions: Collection<MongoStorage.ISession>,
    params?: { polingDelay: number }
  ) {
    if (!NotificationListener.isConnected) {
      NotificationListener.bot = bot
      NotificationListener.sessions = sessions

      NotificationListener.polingDelay =
        params?.polingDelay ||
        (process.env.POLING_DELAY ? parseInt(process.env.POLING_DELAY) : 3000)

      NotificationListener.socket = io(process.env.API_WEBSOCKET_URL || "", {
        transports: ["websocket"],
        autoConnect: true,
        reconnectionDelayMax: 10000,
        extraHeaders: {
          // Authorization: `Bearer ${NotificationListener.ctx.session.token}`,
          Authorization: getApiClientHeader(
            process.env.API_CLIENT_NAME,
            process.env.API_CLIENT_PASSWORD
          ),
        },
      })

      NotificationListener.socket.io.on("error", NotificationListener.onError)
      NotificationListener.socket.on("connect", NotificationListener.onConnect)
      NotificationListener.socket.on(
        "notification",
        NotificationListener.makeEffect
      )
      NotificationListener.socket.on("inited", NotificationListener.onInited)
      NotificationListener.socket.on(
        "exception",
        NotificationListener.onException
      )
      NotificationListener.socket.on(
        "disconnect",
        NotificationListener.onDisconnect
      )
    }
  }

  private static emit(message: string, data?: unknown) {
    if (NotificationListener.socket) {
      NotificationListener.socket.emit(message, data)
    }
  }

  private static emitWithAck(message: string, data?: unknown) {
    if (NotificationListener.socket) {
      return NotificationListener.socket.emitWithAck(message, data)
    }
  }

  private static async getNotificationRecipient(
    notification: NotificationDto
  ): Promise<NotificationRecipient | undefined> {
    let recipient: NotificationRecipient | undefined = undefined

    if (NotificationListener.sessions) {
      const allSessionsWithToken = NotificationListener.sessions.find({
        "value.token": { $exists: true, $ne: "" },
      })

      let session = undefined
      while ((await allSessionsWithToken.hasNext()) && !recipient) {
        session = (await allSessionsWithToken.next()) as {
          key: string
          value: SessionData
        }

        if (session.value.token) {
          const { userId, roles = [] }: Partial<TokenPayloadDto> = jwtDecode(
            session.value.token
          )

          if (
            userId &&
            // NOTICE: roles empty or user have any required role
            (!notification.roles.length ||
              notification.roles.find((role) => roles.includes(role))) &&
            // NOTICE: recipients empty or user is in recipients list
            (!notification.recipients.length ||
              notification.recipients.includes(userId)) &&
            // NOTICE: user is not in received list
            !notification.received.includes(userId)
          ) {
            recipient = {
              chatId: session.key.split("/")[1],
              token: session.value.token,
            }
            allSessionsWithToken.rewind()
          }
        }
      }
    }
    return recipient
  }

  private static async makeEffect(notification: NotificationDto) {
    let menuItemBreadCrumbs: Array<string> | undefined

    const recipient = await NotificationListener.getNotificationRecipient(
      notification
    )

    if (!recipient) {
      return
    }

    let message:
      | { text: string; options: { [key: string]: unknown } }
      | undefined = undefined
    switch (notification.type) {
      case NotificationTypes.NEW_THERAPY_REQUEST:
      case NotificationTypes.TRANSFER_THERAPY_REQUEST:
        menuItemBreadCrumbs = getMenuItemBreadCrumbs(
          MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW
        )

        message = {
          text:
            "*Пришел новый терапевтический запрос*" +
            (menuItemBreadCrumbs?.length
              ? `\r\n${ReplyMarkup.escapeForParseModeV2(
                  menuItemBreadCrumbs.join(" > ")
                )}`
              : ""),
          options: {
            ...ReplyMarkup.parseModeV2,
            reply_markup: new InlineKeyboard().text(
              "Перейти",
              JSON.stringify({
                goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW,
              })
            ),
          },
        }
        break
    }

    if (message) {
      try {
        // NOTICE: First we send a notification of receipt, then we send a notification to user to avoid repetitions
        const result = await NotificationListener.sendNotificationOfReceipt(
          notification._id,
          recipient.token
        )

        if (result) {
          await NotificationListener.bot.api.sendMessage(
            recipient.chatId,
            message.text,
            message.options
          )
        }
      } catch (error) {
        console.error("Notification delivery error", error)
      }
    }
  }

  private static sendNotificationOfReceipt(
    notificationId: string,
    token: string
  ) {
    return NotificationListener.emitWithAck("notifications/add-received", {
      notificationId,
      token,
    })
  }

  private static async onInited() {
    console.log("Notifications: inited")
  }

  private static async onError(error: unknown) {
    console.log("Notifications: error", error)
  }

  private static async onConnect() {
    console.log("Notifications: connected")

    NotificationListener.pollingInterval = setInterval(() => {
      NotificationListener.emit("notifications/get-all")
    }, NotificationListener.polingDelay)

    NotificationListener.isConnected = true
  }
  private static async onDisconnect() {
    console.log("Notifications: disconnected")

    clearInterval(NotificationListener.pollingInterval)
    NotificationListener.isConnected = false
    delete NotificationListener.pollingInterval
    delete NotificationListener.socket
  }

  private static async onException(exception: unknown) {
    console.log("Notifications: exception", exception)
  }
}
