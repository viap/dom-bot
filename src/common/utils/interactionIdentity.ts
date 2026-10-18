import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { UserDto } from "@/common/dto/user.dto"
import { TokenPayloadDto } from "@/common/dto/tokenPayload.dto"
import { jwtDecode } from "jwt-decode"

export function normalizeRoles(roles: ReadonlyArray<string> = []): Array<string> {
  return [...new Set(roles)].sort()
}

export function tokenMatchesUser(
  token: string,
  user: Pick<UserDto, "_id" | "roles">
): boolean {
  const payload = decodeTokenPayload(token)

  return (
    payload !== undefined &&
    payload.userId === user._id &&
    JSON.stringify(normalizeRoles(payload.roles)) ===
      JSON.stringify(normalizeRoles(user.roles))
  )
}

export function tokenUserIdMatches(
  token: string,
  user: Pick<UserDto, "_id">
): boolean {
  return decodeTokenPayload(token)?.userId === user._id
}

export function createAccessKey(
  user: Pick<UserDto, "_id" | "roles">,
  psychologist?: Pick<PsychologistDto, "_id">
): string {
  return JSON.stringify([
    user._id,
    normalizeRoles(user.roles),
    psychologist?._id || null,
  ])
}

function decodeTokenPayload(token: string): TokenPayloadDto | undefined {
  try {
    const payload = jwtDecode<Partial<TokenPayloadDto>>(token)

    if (
      typeof payload.userId !== "string" ||
      !Array.isArray(payload.roles) ||
      !payload.roles.every((role) => typeof role === "string")
    ) {
      return undefined
    }

    return payload as TokenPayloadDto
  } catch {
    return undefined
  }
}
