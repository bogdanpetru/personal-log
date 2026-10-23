import { LANGUAGES } from "./languages";

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Combining_Mark}/gu, "")
    .toLowerCase();
}

export function searchLanguages(query: string) {
  const needle = fold(query.trim());
  if (needle === "") {
    return LANGUAGES;
  }
  return LANGUAGES.filter((option) =>
    fold(`${option.label} ${option.english} ${option.code}`).includes(needle),
  );
}