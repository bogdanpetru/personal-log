import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Log } from "@personal-log/plugin-api";

const mocks = vi.hoisted(() => {
  const makeLog = (id: string): Log => ({
    id,
    createdAt: "2025-01-01T10:00:00.000Z",
    durationMs: 1000,
    audio: {
      id: `${id}-audio`,
      mimeType: "audio/webm",
      size: 10,
      createdAt: "2025-01-01T10:00:00.000Z",
    },
    transcriptions: [],
  });
  return {
    makeLog,
    logs: [] as Log[],
  };
});

vi.mock("@/hooks/usePersonalLog", () => ({
  usePersonalLog: () => ({
    core: {
      setLanguage: () => undefined,
      on: () => () => undefined,
    },
    state: { status: "idle", seconds: 0, transcript: "", partial: "" },
    supported: true,
    playbackSrc: null,
    playbackAudio: null,
    finishedLog: null,
    getAudioStream: () => null,
    logs: mocks.logs,
    refreshLogs: async () => mocks.logs,
    loadLogData: async () => undefined,
    deleteLog: async () => {
      mocks.logs = mocks.logs.slice(1);
    },
  }),
}));

describe("App", () => {
  it("lands on the recorder when no logs are stored", async () => {
    mocks.logs = [];
    render(<App />);
    expect(
      await screen.findByRole("button", { name: "Start recording" }),
    ).toBeInTheDocument();
  });

  it("lands on the list when logs are stored", async () => {
    mocks.logs = [mocks.makeLog("a"), mocks.makeLog("b")];
    render(<App />);
    expect(
      await screen.findByRole("button", { name: "New" }),
    ).toBeInTheDocument();
  });
});