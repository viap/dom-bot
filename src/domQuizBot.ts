import {Bot, ChatTypeContext, CommandContext, Composer, session, Context, SessionFlavor, GrammyError, HttpError, Keyboard} from "grammy"
import { 
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation, } from "@grammyjs/conversations";
import { Menu } from "@grammyjs/menu";
import { TOKEN } from "./config/consts"
import { AnswerProps, Quiz, QuizProps } from "./modules/Quiz/index";
import { firstQuiz } from "./modules/Quiz/Entities/firstQuiz"

type SessionData = {
    hasTermsAgreement: boolean
    progress?: QuizProps
}

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor
type MyConversation = Conversation<MyContext>;

export const domBot = (new Bot<MyContext>(TOKEN))
// const privateBot = domBot.chatType("private")

function sessionInit (): SessionData {
    return { hasTermsAgreement: false }
}

async function quizProgress(conversation: MyConversation, ctx: MyContext){
    
    if(firstQuiz.isFinished()){
        await ctx.reply("Вы уже прошли тест, хотите повторить?", {reply_markup: new Keyboard([[{"text": "Да"}, {text:"Нет"}]])})
        const response = await conversation.waitFor(":text");
        if(response.msg.text === "Да") {
            //Notice: пока не используется
            delete ctx.session.progress
        } else {
            return await ctx.reply("Ок", {reply_markup:{remove_keyboard:true}})
        }
    }
    
    while (!firstQuiz.isFinished()) {
        ctx.reply(firstQuiz.getQuestion().content,
            {reply_markup: firstQuiz.getKeyboard()}
        )
        const response = await conversation.waitFor(":text");
        firstQuiz.setAnswerByResponse(response.msg.text)
    }

    await ctx.reply("Вы прошли тест, поздравляю!", {reply_markup: {remove_keyboard:true}});

    // await ctx.reply("How many favorite movies do you have?");
    // const count = await conversation.form.number();
    // const movies: string[] = [];
    // for (let i = 0; i < count; i++) {
    //   await ctx.reply(`Tell me number ${i + 1}!`);
    //   const titleCtx = await conversation.waitFor(":text");
    //   movies.push(titleCtx.msg.text);
    // }
    // await ctx.reply("Here is a better ranking!");
    // movies.sort();
    // await ctx.reply(movies.map((m, i) => `${i + 1}. ${m}`).join("\n"));
}

domBot.api.setMyCommands([
    { command: "start", description: "Запустить бота" },
    { command: "start_quiz", description: "Начать прохождение теста" },
    // { command: "help", description: "Показать подсказки" },
    // { command: "settings", description: "Настройки" },
  ]);

domBot.use(session({initial: sessionInit}))
domBot.use(conversations())
domBot.use(createConversation(quizProgress))

domBot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
});

domBot.callbackQuery("cancel_quiz", async (ctx) => {
    await ctx.conversation.exit("quizProgress");
    await ctx.answerCallbackQuery("Прохождение теста завершено!");
});

domBot.command("start", (ctx)=>{
    ctx.reply("Добро пожаловать!")
})

domBot.command("start_quiz", async (ctx)=>{
    console.log("On command - startQuiz")
    
    await ctx.conversation.enter("quizProgress")
})

domBot.on("message", (ctx)=>{
    ctx.reply(`Got a message - ${ctx.message.text}`)
})
