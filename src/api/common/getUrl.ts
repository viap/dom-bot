export function getUrl(url: string): string {
  return new URL(url, process.env.API_URL).toString()
}
