import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from "@grammyjs/types"
import { ContactInfo, Psychologist } from "../types"
import { PSY_SCHOOLS } from "../components/Quiz/consts"

export const ReplyMarkup = {
  emptyKeyboard: { remove_keyboard: true } as ReplyKeyboardRemove,
  oneTime: { one_time_keyboard: true } as ReplyKeyboardMarkup,
}

export enum BOT_COMMANDS {
  START = "start",
  MENU = "menu",
  START_QUIZ = "start_quiz",
  SELECT_QUIZ = "select_quiz",
  TERMS = "terms",
}

export enum BOT_COMMANDS_DESCR {
  START = "Запустить бота",
  MENU = "Меню",
  START_QUIZ = "Начать прохождение теста",
  SELECT_QUIZ = "Выберите тест для прохождения",
  TERMS = "Соглашение использования",
}

export enum BOT_MSG {
  WELCOME = "Добро пожаловать!",
  DEFAULT = "Получил сообщение",
  UNAVAILABLE = "Сервис не доступен :-(",
}

export enum BOT_ERROR {
  UPDATE = "Error while handling update",
  REQUEST = "Error in request",
  UNAVAILABLE = "Could not contact Telegram",
  UNKNOWN = "Unknown error",
  CONVERSATION = "Error in conversation",
}

export enum CALLBACK {
  QUIZ_CANCEL = "cancel_quiz",
  TERMS_YES = "terms_yes",
  TERMS_NO = "terms_no",
}

export const commonContacts: ContactInfo = {
  telegram: "Soroka_tg",
  instagram: "psydom_tbilisi",
  whatsapp: "",
  phone: "995557701626",
}

export const listOfPsychologists: Array<Psychologist<PSY_SCHOOLS>> = [
  {
    schools: [
      PSY_SCHOOLS.EXISTENSE,
      PSY_SCHOOLS.ANALYZE,
      PSY_SCHOOLS.CBT,
      PSY_SCHOOLS.GESTALT,
    ],
    name: "Алёна Чалова",
    descr: "Кандидат психологических наук и бла бла бла",
    photo: "chalova_alena.png",
    contacts: commonContacts,
  },
  {
    schools: [PSY_SCHOOLS.ANALYZE],
    name: "Виктор Заикин",
    descr: "Кандидат психологических наук и бла, бла, бла ...",
    photo: "",
    contacts: commonContacts,
  },
]
