import mongoose from "mongoose"
import { MenuBlockSchema } from "../schemas/menuBlock.schema"

export const MenuModel = mongoose.model("Menu", MenuBlockSchema)
