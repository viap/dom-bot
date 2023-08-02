import mongoose from "mongoose"
import { GivenAnswerProps } from "../types/givenAnswerProps"

export const GivenAnswerSchema = new mongoose.Schema<GivenAnswerProps>({
  // session: { type: mongoose.Types.ObjectId, ref: "Session" },
  // quiz: { type: mongoose.Types.ObjectId, ref: "Quiz" },
  question: { type: Number },
  answer: { type: Number },
})
