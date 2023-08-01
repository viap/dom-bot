export function getUrl(url: string, params?: object): string {
  const uri = (process.env.API_URL || "") + url

  if (params) {
    Object.entries(params).forEach((entry: Array<string>) => {
      uri.replace(`:${entry[0]}`, entry[1])
    })
  }

  return uri
}
