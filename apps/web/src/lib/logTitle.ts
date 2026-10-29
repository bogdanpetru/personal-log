import type { Log } from "@personal-log/plugin-api";

export function formatTitle(log: Log): string {
  return new Date(log.createdAt).toLocaleString("sv", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function logTitle(log: Log): string {
  return log.title ?? formatTitle(log);
}
