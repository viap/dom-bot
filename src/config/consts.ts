import { ReplyKeyboardMarkup, ReplyKeyboardRemove } from "@grammyjs/types"
import fs from "fs"
import { cwd } from "process"

export const TOKEN =  fs.readFileSync(cwd()+"/src/config/token",{encoding:'utf8'})

export const ReplyMarkup = {
    emptyKeyboard: {remove_keyboard: true} as ReplyKeyboardRemove,
    oneTime: {one_time_keyboard: true} as ReplyKeyboardMarkup
}

export enum BOT_COMMANDS {
    START="start",
    SELECT_QUIZ="select_quiz",
    TERMS="terms"
}

export enum BOT_COMMANDS_DESCR {
    START="Запустить бота",
    SELECT_QUIZ="Начать прохождение теста",
    TERMS="Соглашение использования"
}

export enum BOT_MSG {
    WELCOME="Добро пожаловать!",
    DEFAULT="Получил сообщение"
}

export enum BOT_ERROR {
    UPDATE="Error while handling update",
    REQUEST="Error in request",
    UNAVAILABLE="Could not contact Telegram",
    UNKNOWN="Unknown error",
    CONVERSATION="Error in conversation"
}

export enum CALLBACK {
    QUIZ_CANCEL="cancel_quiz",
    TERMS_YES="terms_yes",
    TERMS_NO="terms_no"
}
export enum QUIZ_MSG {
    REPLAY = "Вы уже прошли тест, хотите повторить?",
    REPLAY_YES="Да",
    REPLAY_NO="Нет",
    REPLAY_NO_REPLY="Ок",
    
    SHOW_RESULT="Посмотреть результат",
    CONGRATS="Опрос завершен 🥳"
}

export enum CONVERSATION_NAME {
    QUIZ_PROGRESS="quiz_progress",
    TERMS_AGREEMENT="terms_agreement"
}

export enum TERMS {
    YES="Принимаю",
    YES_REPLY="Здорово 😉",
    NO="Не принимаю",
    NO_REPLY="Очень жаль 😟",
    DESCRIPTION="Список условий и отказ от ответственности",
}