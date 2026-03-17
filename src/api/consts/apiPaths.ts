export const API_PATHS = {
  auth: {
    loginByTelegram: "/auth/login/telegram",
    checkToken: "/auth/check-token",
    refreshToken: "/auth/refresh-token",
  },
  users: {
    all: "/users",
    one: (userId: string) => `/users/${userId}`,
    edit: (userId: string) => `/users/${userId}`,
  },
  psychologists: {
    all: "/psychologists",
    one: (psychologistId: string) => `/psychologists/${psychologistId}`,
    clients: (psychologistId: string) =>
      `/psychologists/${psychologistId}/clients`,
    create: "/psychologists",
    addClient: (psychologistId: string) =>
      `/psychologists/${psychologistId}/add-new-client`,
    editClient: (psychologistId: string, userId: string) =>
      `/psychologists/${psychologistId}/edit-client/${userId}`,
    deleteOne: (psychologistId: string) => `/psychologists/${psychologistId}`,
    deleteClient: (psychologistId: string, userId: string) =>
      `/psychologists/${psychologistId}/delete-client/${userId}`,
  },
  therapySessions: {
    all: "/therapy-sessions",
    allForPeriod: (from: number, to: number) =>
      `/therapy-sessions/from/${from}/to/${to}`,
    one: (therapySessionId: string) => `/therapy-sessions/${therapySessionId}`,
    create: "/therapy-sessions",
    createForPsychologist: (psychologistId: string) =>
      `/therapy-sessions/${psychologistId}`,
    forPsychologist: (psychologistId: string) =>
      `/therapy-sessions/psychologist/${psychologistId}`,
    forPsychologistForPeriod: (
      psychologistId: string,
      from: number,
      to: number
    ) =>
      `/therapy-sessions/psychologist/${psychologistId}/from/${from}/to/${to}`,
    forPsychologistWithClient: (psychologistId: string, userId: string) =>
      `/therapy-sessions/psychologist/${psychologistId}/client/${userId}`,
    statisticForPeriod: (from: number, to: number) =>
      `/therapy-sessions/statistic/from/${from}/to/${to}`,
    statisticForPsychologistForPeriod: (
      psychologistId: string,
      from: number,
      to: number
    ) =>
      `/therapy-sessions/statistic/psychologist/${psychologistId}/from/${from}/to/${to}`,
  },
  therapyRequests: {
    all: "/therapy-requests",
    one: (therapyRequestId: string) => `/therapy-requests/${therapyRequestId}`,
    forPsychologist: (psychologistId: string) =>
      `/therapy-requests/psychologist/${psychologistId}`,
    create: "/therapy-requests",
    accept: (therapyRequestId: string) =>
      `/therapy-requests/${therapyRequestId}/accept`,
    reject: (therapyRequestId: string) =>
      `/therapy-requests/${therapyRequestId}/reject`,
    edit: (therapyRequestId: string) => `/therapy-requests/${therapyRequestId}`,
    deleteOne: (therapyRequestId: string) =>
      `/therapy-requests/${therapyRequestId}`,
  },
  notifications: {
    create: "/notifications",
  },
}
