import mongoose from "mongoose"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export const MenuBlockSchema = new mongoose.Schema<MenuBlockItemsProps>({
  // _id: { type: mongoose.Types.ObjectId, required: true },
  key: { type: String, required: false },
  name: { type: String, required: true },
  descr: { type: String, required: true },
  items: Array<{
    type: MenuBlockItemsProps
    required: true
    default: []
    ref: "Menu"
  }>,
  conversation: { type: String, required: false },
})
