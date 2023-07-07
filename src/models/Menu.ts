import mongoose from "mongoose"
import { CONVERSATION_NAME } from "../conversations/consts"

export type MenuProps = {
  // _id: mongoose.Types.ObjectId
  key?: string
  name: string
  descr: string
  order: number
  children: Array<MenuProps>
  conversation?: CONVERSATION_NAME
}

export const MenuSchema = new mongoose.Schema<MenuProps>({
  // _id: { type: mongoose.Types.ObjectId, required: true },
  key: { type: String, required: false },
  name: { type: String, required: true },
  descr: { type: String, required: true },
  order: { type: Number, required: true },
  children: Array<{
    type: MenuProps
    required: true
    default: []
    ref: "Menu"
  }>,
  conversation: { type: String, required: false },
})

export enum MENU_LISTS {
  TELERGAM = "telegram",
}

export const DefaultMenu: MenuProps = {
  key: MENU_LISTS.TELERGAM,
  name: "Меню",
  descr: "Меню для Телеграма",
  children: [
    {
      name: "Расписание",
      descr: "Расписание кабинетов DOM'а",
      children: [],
      order: 0,
    },
    {
      name: "Забронировать кабинет",
      descr: "Забронировать кабинет",
      children: [],
      order: 1,
    },
    {
      name: "О пространстве",
      descr: "Описание",
      children: [],
      order: 2,
    },
    {
      name: "Кабинет",
      descr: "Личный кабинет члена команды DOM'a",
      children: [
        {
          name: "Добавить клиента",
          descr: "",
          children: [],
          order: 0,
        },
        {
          name: "Отметить сессию",
          descr: "",
          children: [],
          order: 0,
        },
      ],
      order: 3,
    },
  ],
  order: 0,
}

export const MenuModel = mongoose.model("Menu", MenuSchema)
