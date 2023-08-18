// _*[]()~`>#+-=|{}.!\
export const telegramParseModeV2CharsEscape = (string: string) =>
  string.replace(/([_*[\]()~`>#\\+-=|{}.!\\])/g, `\\$1`)
