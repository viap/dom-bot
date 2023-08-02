import mongoose from "mongoose"
import { GivenAnswerSchema } from "../schemas/givenAnswer.schema"

export const GivenAnswerModel = mongoose.model("GivenAnswer", GivenAnswerSchema)
