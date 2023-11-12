import { InlineKeyboard } from "grammy"
import { io, Socket } from "socket.io-client"
import { NotificationDto } from "../../common/dto/notification.dto"
import NotificationTypes from "../../common/enums/notificationTypes"
import { MyContext } from "../../common/types/myContext"
import MENU_ITEM_TYPES from "../../components/MenuBlock/enums/menuItemTypes.enum"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import getMenuItemBreadCrumbs from "../../components/MenuBlock/utils/getMenuItemBreadCrumbs"

export default class NotificationListener {
  private static ctx: MyContext
  private static socket: Socket | undefined
  private static isConnected: boolean
  private static pollingInterval: NodeJS.Timeout | undefined
  private static polingDelay: number

  static start(ctx: MyContext, params?: { polingDelay: number }) {
    if (!NotificationListener.isConnected && ctx.session.token) {
      NotificationListener.ctx = ctx

      NotificationListener.polingDelay =
        params?.polingDelay ||
        (process.env.POLING_DELAY ? parseInt(process.env.POLING_DELAY) : 3000)

      NotificationListener.socket = io(process.env.API_WEBSOCKET_URL || "", {
        transports: ["websocket"],
        autoConnect: true,
        reconnectionDelayMax: 10000,
        extraHeaders: {
          Authorization: `Bearer ${NotificationListener.ctx.session.token}`,
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

  private static async makeEffect(notification: NotificationDto) {
    let menuItemBreadCrumbs: Array<string> | undefined
    switch (notification.type) {
      case NotificationTypes.NEW_THERAPY_REQUEST:
      case NotificationTypes.TRANSFER_THERAPY_REQUEST:
        menuItemBreadCrumbs = getMenuItemBreadCrumbs(
          MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW
        )
        await NotificationListener.ctx.reply(
          "*Пришел новый терапевтический запрос*" +
            (menuItemBreadCrumbs?.length
              ? `\r\n${ReplyMarkup.escapeForParseModeV2(
                  menuItemBreadCrumbs.join(" > ")
                )}`
              : ""),
          {
            reply_markup: new InlineKeyboard().text(
              "Перейти",
              JSON.stringify({
                goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW,
              })
            ),
            ...ReplyMarkup.parseModeV2,
          }
        )
        NotificationListener.sendNotificationOfDelivery(notification._id)
        break
    }
  }

  private static sendNotificationOfDelivery(notificationId: string) {
    NotificationListener.emit("notifications/add-received", {
      notificationId,
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
      NotificationListener.emit("notifications")
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
