import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from "@grammyjs/types"
import { Psychologist } from "../types"
import { PSY_SCHOOLS } from "../modules/Quiz/consts"

export const ReplyMarkup = {
  emptyKeyboard: { remove_keyboard: true } as ReplyKeyboardRemove,
  oneTime: { one_time_keyboard: true } as ReplyKeyboardMarkup,
}

export enum BOT_COMMANDS {
  START = "start",
  START_QUIZ = "start_quiz",
  SELECT_QUIZ = "select_quiz",
  TERMS = "terms",
}

export enum BOT_COMMANDS_DESCR {
  START = "Запустить бота",
  START_QUIZ = "Начать прохождение теста",
  SELECT_QUIZ = "Выберите тест для прохождения",
  TERMS = "Соглашение использования",
}

export enum BOT_MSG {
  WELCOME = "Добро пожаловать!",
  DEFAULT = "Получил сообщение",
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
export enum QUIZ_MSG {
  REPLAY = "Вы уже прошли тест, хотите повторить?",
  REPLAY_YES = "Да",
  REPLAY_NO = "Нет",
  REPLAY_NO_REPLY = "Ок",

  UNKNOWN_ANSWER = "Непонятный ответ, выберите из предложенных вариантов:",

  SHOW_RESULT = "Посмотреть результат",
  CONGRATS = "Опрос завершен 🥳",
}

export enum CONVERSATION_NAME {
  TERMS_AGREEMENT = "terms_agreement",
  QUIZ_PROGRESS = "quiz_progress",
  SELECT_QUIZ = "select_quiz",
}

export enum TERMS {
  YES = "Принимаю",
  YES_REPLY = "Здорово 😉",
  NO = "Не принимаю",
  NO_REPLY = "Очень жаль 😟",
  DESCRIPTION = "Список условий и отказ от ответственности",
}
