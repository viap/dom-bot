export const API_PATHS = {
  auth: {
    checkToken: "/auth/check-token",
    loginByTelegram: "/auth/login/telegram",
  },
  users: {
    all: "/users",
    me: "/users/me",
    one: "/users/:id",
  },
  psychologists: {
    all: "/psychologists",
    me: "/psychologists/me",
    one: "/psychologists/:id",
    addMyNewClient: "/psychologists/me/add-new-client",
  },
  therapySessions: {
    all: "/therapy-sessions",
    my: "/therapy-sessions/my",
    one: "/therapy-sessions/:id",
  },
}
