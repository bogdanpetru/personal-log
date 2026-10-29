import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LogView } from "./LogView";
import type { Log } from "@personal-log/plugin-api";

const log: Log = {
  id: "a",
  createdAt: "2025-01-01T10:00:00.000Z",
  durationMs: 1500,
  audio: {
    id: "a-audio",
    mimeType: "audio/webm",
    size: 10,
    createdAt: "2025-01-01T10:00:00.000Z",
  },
  transcriptions: [
    {
      id: "a-transcription",
      logId: "a",
      providerId: "test",
      language: "en-US",
      createdAt: "2025-01-01T10:00:00.000Z",
      text: "hello",
    },
  ],
};

function renderLogView(entry: Log, onRename = vi.fn()) {
  render(
    <MemoryRouter>
      <LogView log={entry} audio={new Blob()} audioUrl="blob:mock" onRename={onRename} />
    </MemoryRouter>,
  );
  return onRename;
}

describe("LogView", () => {
  it("shows the language next to the title", () => {
    renderLogView(log);
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("falls back to the creation time when no title is stored", () => {
    renderLogView(log);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "2025-01-01",
    );
  });

  it("renames the recording from the title", () => {
    const onRename = renderLogView(log);
    fireEvent.click(screen.getByRole("heading", { level: 1 }));
    const input = screen.getByRole("textbox", { name: "Recording title" });
    fireEvent.change(input, { target: { value: "Morning notes" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith("Morning notes");
  });

  it("shows the stored title", () => {
    renderLogView({ ...log, title: "Morning notes" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Morning notes",
    );
  });

  it("offers the download format next to the share button", () => {
    renderLogView(log);
    expect(
      screen.getByRole("combobox", { name: "Download format" }),
    ).toHaveTextContent("Original");
    expect(
      screen.getByRole("button", { name: "Share recording" }),
    ).toBeInTheDocument();
  });
});
