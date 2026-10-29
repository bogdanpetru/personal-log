import { describe, expect, it } from "vitest";
import { formatTitle, logTitle } from "./logTitle";
import type { Log } from "@personal-log/plugin-api";

function makeLog(overrides: Partial<Log> = {}): Log {
  return {
    id: "a",
    createdAt: "2025-01-01T10:00:00.000Z",
    durationMs: 1000,
    audio: {
      id: "a-audio",
      mimeType: "audio/webm",
      size: 10,
      createdAt: "2025-01-01T10:00:00.000Z",
    },
    transcriptions: [],
    ...overrides,
  };
}

describe("logTitle", () => {
  it("prefers the stored title", () => {
    expect(logTitle(makeLog({ title: "Morning notes" }))).toBe(
      "Morning notes",
    );
  });

  it("falls back to the formatted creation time", () => {
    const log = makeLog();
    expect(logTitle(log)).toBe(formatTitle(log));
    expect(logTitle(log)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
