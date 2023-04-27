import * as MongoStorage from "@grammyjs/storage-mongodb"
import mongoose from "mongoose"

export type GivenAnswerProps = {
  // session: any //MongoStorage.ISession
  // quiz: any
  question: number
  answer: number
}

export const GivenAnswerSchema = new mongoose.Schema<GivenAnswerProps>({
  // session: { type: mongoose.Types.ObjectId, ref: "Session" },
  // quiz: { type: mongoose.Types.ObjectId, ref: "Quiz" },
  question: { type: Number },
  answer: { type: Number },
})

export const GivenAnswer = mongoose.model("GivenAnswer", GivenAnswerSchema)
