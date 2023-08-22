import { SocialNetworks } from "../enums/socialNetworks.enum"

export type ContactDto = {
  id?: string
  network: SocialNetworks
  username: string
  hidden?: boolean
}
