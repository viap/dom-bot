import mongoose from "mongoose"
import { GivenAnswerSchema } from "../schemas/givenAnswer"

export const GivenAnswerModel = mongoose.model("GivenAnswer", GivenAnswerSchema)
