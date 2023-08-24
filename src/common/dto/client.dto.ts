import { TherapyRequestDto } from "./therapyRequest.dto"
import { UserDto } from "./user.dto"

export type ClientDto = {
  user: UserDto
  descr: string
  therapyRequest?: TherapyRequestDto
}
