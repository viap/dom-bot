import { domBot } from "./domQuizBot";

import {run} from "@grammyjs/runner"

const runner = run(domBot)
if(runner.isRunning()){
    console.log("Bot was started")
} else {
    console.log("Something went wrong on bot starting")
}