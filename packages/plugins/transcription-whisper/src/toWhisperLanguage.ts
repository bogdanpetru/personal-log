export function toWhisperLanguage(language: string): string {
  return language.split("-")[0]?.toLowerCase() ?? language;
}
