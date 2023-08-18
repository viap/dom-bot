import { ApiPaths } from "../type/apiPaths"

export const API_PATHS: ApiPaths = {
  auth: {
    GET: {
      loginByTelegram: "/auth/login/telegram",
      checkToken: "/auth/check-token",
    },
    POST: {},
    PUT: {},
    DELETE: {},
  },
  users: {
    GET: {
      all: "/users",
      one: "/users/:userId",
    },
    POST: {},
    PUT: {},
    DELETE: {},
  },
  psychologists: {
    GET: {
      all: "/psychologists",
      one: "/psychologists/:psychologistId",
      clients: "/psychologists/:psychologistId/clients",
    },
    POST: {
      newClient: "/psychologists/:psychologistId/add-new-client",
    },
    PUT: {
      editClient: "/psychologists/:psychologistId/edit-client/:userId",
    },
    DELETE: {
      one: "/psychologists/:psychologistId",
      client: "/psychologists/:psychologistId/delete-client/:userId",
    },
  },
  therapySessions: {
    GET: {
      all: "/therapy-sessions",
      one: "/therapy-sessions/:therapySessionId",
      forPsychologist: "/therapy-sessions/psychologist/:psychologistId",
      forPsychologistWithClient:
        "/therapy-sessions/psychologist/:psychologistId/client/:userId",
    },
    POST: {
      create: "/therapy-sessions",
      createForPsychologist: "/therapy-sessions/:psychologistId",
    },
    PUT: {},
    DELETE: {
      one: "/therapy-sessions/:therapySessionId",
    },
  },
}
