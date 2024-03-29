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
    PUT: {
      edit: "/users/:userId",
    },
    DELETE: {},
  },
  psychologists: {
    GET: {
      all: "/psychologists",
      one: "/psychologists/:psychologistId",
      clients: "/psychologists/:psychologistId/clients",
    },
    POST: {
      create: "/psychologists",
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
      allForPeriod: "/therapy-sessions/from/:from/to/:to",
      one: "/therapy-sessions/:therapySessionId",
      forPsychologist: "/therapy-sessions/psychologist/:psychologistId",
      forPsychologistForPeriod:
        "/therapy-sessions/psychologist/:psychologistId/from/:from/to/:to",
      forPsychologistWithClient:
        "/therapy-sessions/psychologist/:psychologistId/client/:userId",
      statisticForPeriod: "/therapy-sessions/statistic/from/:from/to/:to",
      statisticForPsychologistForPeriod:
        "/therapy-sessions/statistic/psychologist/:psychologistId/from/:from/to/:to",
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
  therapyRequests: {
    GET: {
      all: "/therapy-requests",
      one: "/therapy-requests/:therapyRequestId",
      forPsychologist: "/therapy-requests/psychologist/:psychologistId",
    },
    POST: {
      create: "/therapy-requests",
      accept: "/therapy-requests/:therapyRequestId/accept",
      reject: "/therapy-requests/:therapyRequestId/reject",
    },
    PUT: {
      edit: "/therapy-requests/:therapyRequestId",
    },
    DELETE: {
      one: "/therapy-requests/:therapyRequestId",
    },
  },
}
