import NotificationTypes from "../../common/enums/notificationTypes"
import { NotificationDto } from "../../common/dto/notification.dto"
import { MyContext } from "../../common/types/myContext"
import { io, Socket } from "socket.io-client"

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
      NotificationListener.socket.on("connect", function () {
        NotificationListener.isConnected = true

        NotificationListener.pollingInterval = setInterval(() => {
          NotificationListener.emit("notifications")
        }, NotificationListener.polingDelay)
      })
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
    switch (notification.type) {
      case NotificationTypes.NEW_THERAPY_REQUEST:
      case NotificationTypes.TRANSFER_THERAPY_REQUEST:
        await NotificationListener.ctx.reply(
          "Пришел новый запрос. Перейти [ Меню > Мои заявки > Новые заявки ]"
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
    console.log("Inited")
  }

  private static async onError(error: unknown) {
    console.log("Error", error)
  }

  private static async onDisconnect() {
    console.log("Disconnected")

    clearInterval(NotificationListener.pollingInterval)
    NotificationListener.isConnected = false
    delete NotificationListener.pollingInterval
    delete NotificationListener.socket
  }

  private static async onException(exception: unknown) {
    console.log("exception", exception)
  }
}
