export type ApiPaths = {
  [controller: string]: {
    [requestType in "GET" | "POST" | "PUT" | "DELETE"]: {
      [requestUrl: string]: string
    }
  }
}
