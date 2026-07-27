import { CURRENCIES } from "@/common/enums/currencies"
import { ROLES } from "@/common/enums/roles"
import { SocialNetworks } from "@/common/enums/socialNetworks"
import { ClientDto } from "@/common/dto/client.dto"
import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { TherapySessionDto } from "@/common/dto/therapySession.dto"
import { UserDto } from "@/common/dto/user.dto"

export function makeUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    _id: "user-1",
    name: "Test User",
    descr: "",
    roles: [ROLES.USER],
    contacts: [
      {
        id: "101",
        network: SocialNetworks.Telegram,
        username: "test_user",
      },
    ],
    ...overrides,
  }
}

export function makePsychologist(
  overrides: Partial<PsychologistDto> = {}
): PsychologistDto {
  return {
    _id: "psychologist-1",
    user: makeUser({
      _id: "psy-user-1",
      name: "Psy One",
      roles: [ROLES.PSYCHOLOGIST],
    }),
    currency: CURRENCIES.GEL,
    sessionDurations: [],
    education: [],
    isInTheClub: true,
    clients: [],
    ...overrides,
  }
}

export function makeTherapyRequest(
  overrides: Partial<TherapyRequestDto> = {}
): TherapyRequestDto {
  return {
    _id: "therapy-request-1",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    name: "Client Request",
    descr: "Need help",
    contacts: [],
    accepted: false,
    ...overrides,
  }
}

export function makeClient(overrides: Partial<ClientDto> = {}): ClientDto {
  return {
    user: makeUser({ _id: "client-user-1", name: "Client One" }),
    descr: "Client description",
    ...overrides,
  }
}

export function makeTherapySession(
  overrides: Partial<TherapySessionDto> = {}
): TherapySessionDto {
  return {
    _id: "therapy-session-1",
    dateTime: Date.UTC(2026, 6, 10, 12, 0, 0),
    createdAt: "2026-07-10T12:00:00.000Z",
    updatedAt: "2026-07-10T12:00:00.000Z",
    client: makeUser({ _id: "client-user-1", name: "Client One" }),
    psychologist: makePsychologist(),
    descr: "",
    duration: 60,
    price: { currency: CURRENCIES.GEL, value: 100 },
    commission: { currency: CURRENCIES.GEL, value: 50 },
    ...overrides,
  }
}
