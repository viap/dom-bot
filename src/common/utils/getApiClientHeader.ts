export function getApiClientHeader(name?: string, password?: string): string {
  if (!(name && password)) {
    return ""
  }
  return `ApiClient ${JSON.stringify({ name, password })}`
}
