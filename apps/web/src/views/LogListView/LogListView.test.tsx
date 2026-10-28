import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LogListView } from "./LogListView";
import type { Log } from "@personal-log/plugin-api";

function makeLog(id: string, createdAt: string): Log {
  return {
    id,
    createdAt,
    durationMs: 1000,
    audio: {
      id: `${id}-audio`,
      mimeType: "audio/webm",
      size: 10,
      createdAt,
    },
    transcriptions: [],
  };
}

describe("LogListView", () => {
  const logs = [
    makeLog("a", "2025-01-01T09:00:00.000Z"),
    makeLog("b", "2025-01-01T15:00:00.000Z"),
    makeLog("c", "2025-01-02T08:00:00.000Z"),
  ];

  it("groups rows under one date heading per day", () => {
    render(
      <LogListView
        logs={logs}
        onOpen={vi.fn()}
        onDelete={vi.fn(async () => undefined)}
      />,
    );
    const headings = screen
      .getAllByRole("heading")
      .map((heading) => heading.textContent);
    expect(headings).toHaveLength(2);
    expect(new Date(headings[0]!).getTime()).toBeLessThan(
      new Date(headings[1]!).getTime(),
    );
  });

  it("renders a delete button for every row", () => {
    render(
      <LogListView
        logs={logs}
        onOpen={vi.fn()}
        onDelete={vi.fn(async () => undefined)}
      />,
    );
    expect(
      screen.getAllByRole("button", { name: "Delete recording" }),
    ).toHaveLength(3);
  });
});