import { SocialNetworks } from "../enums/socialNetworks"

export type ContactDto = {
  id?: string
  network: SocialNetworks
  username: string
  hidden?: boolean
}
