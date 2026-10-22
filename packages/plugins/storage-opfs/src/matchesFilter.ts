import type { Log, LogFilter } from "@personal-log/plugin-api";

/** Whether a log's metadata matches the (entirely optional) filter. */
export function matchesFilter(log: Log, filter: LogFilter | undefined): boolean {
  if (filter === undefined) {
    return true;
  }
  if (filter.from !== undefined && log.createdAt < filter.from) {
    return false;
  }
  if (filter.to !== undefined && log.createdAt >= filter.to) {
    return false;
  }
  if (filter.search !== undefined && filter.search !== "") {
    const needle = filter.search.toLocaleLowerCase();
    const haystack = log.transcriptions
      .map((transcription) => transcription.text)
      .join(" ")
      .toLocaleLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }
  return true;
}