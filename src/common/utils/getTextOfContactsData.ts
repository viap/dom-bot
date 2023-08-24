import { ContactDto } from "../dto/contact.dto"
import { SocialNetworks } from "../enums/socialNetworks.enum"
import { DataStructure } from "../types/dataStructure"
import { getTextOfData } from "./getTextOfData"

export function getTextOfContactsData(
  contacts: Array<ContactDto>,
  title = "контакты"
): string {
  const data: DataStructure = {}

  ;(contacts || []).forEach((contact) => {
    data[contact.network] = `${
      SocialNetworks.Telegram === contact.network ? "@" : ""
    }${contact.username}`
  })

  if (Object.keys(data).length) {
    return getTextOfData(title, data)
  }

  return ""
}
