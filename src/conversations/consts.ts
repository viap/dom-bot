export enum CONVERSATION_NAME {
  TERMS_AGREEMENT = "terms_agreement",
  QUIZ_PROGRESS = "quiz_progress",
  SELECT_QUIZ = "select_quiz",
  SELECT_MENU_ITEM = "select_menu_item",
  MARK_SESSION = "mark_session",
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

export const enum QUIZ_RESULT {
  TITLE = "Вам подходят следующие направления:",
  OFFER_TITLE = "Психологический центр DOM предлагает следующих специалистов:",
  NO_OFFER = "К сожалению у нас нет таких специалистов :-(",
}

export enum TERMS {
  YES = "Принимаю",
  YES_REPLY = "Здорово 😉",
  NO = "Не принимаю",
  NO_REPLY = "Очень жаль 😟",
  DESCRIPTION = "Список условий и отказ от ответственности",
}

export enum SELECT_MENU_ITEM {
  EMPTY_MENY = "Нет меню :-(",
}
