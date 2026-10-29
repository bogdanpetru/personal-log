import en, { type Messages } from "./messages/en";

export type MessageKey = keyof Messages;
export type MessageParams = Record<string, string | number>;

export function translate(
  messages: Partial<Messages>,
  key: MessageKey,
  params?: MessageParams,
): string {
  const template = messages[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params?.[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}
