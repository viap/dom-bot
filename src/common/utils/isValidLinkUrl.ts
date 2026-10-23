import { isIP } from "node:net"

export function isValidLinkUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false
    }

    const hostname = url.hostname.replace(/^\[|\]$/gu, "")
    return isIP(hostname) !== 0 || hostname.includes(".")
  } catch {
    return false
  }
}
