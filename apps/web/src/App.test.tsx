import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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

  function formatTitle(log: Log): string {
    return new Date(log.createdAt).toLocaleString("sv", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return {
    makeLog,
    formatTitle,
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
    loadLogData: async (logId: string) => {
      const log = mocks.logs.find((entry) => entry.id === logId);
      return log === undefined
        ? undefined
        : { log, audio: new Blob(), url: "blob:mock" };
    },
    deleteLog: async () => {
      mocks.logs = mocks.logs.slice(1);
    },
  }),
}));

function renderApp(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("lands on the recorder when no logs are stored", async () => {
    mocks.logs = [];
    renderApp("/record");
    expect(
      await screen.findByRole("button", { name: "Start recording" }),
    ).toBeInTheDocument();
  });

  it("redirects / to the list", async () => {
    mocks.logs = [mocks.makeLog("a"), mocks.makeLog("b")];
    renderApp("/");
    expect(
      await screen.findByRole("link", { name: "New" }),
    ).toBeInTheDocument();
  });

  it("shows the list when logs are stored", async () => {
    mocks.logs = [mocks.makeLog("a"), mocks.makeLog("b")];
    renderApp("/records");
    expect(
      await screen.findByRole("link", { name: "New" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", {
        name: mocks.formatTitle(mocks.logs[0]!),
      }),
    ).toHaveLength(2);
  });

  it("redirects an empty list to the recorder", async () => {
    mocks.logs = [];
    renderApp("/records");
    expect(
      await screen.findByRole("button", { name: "Start recording" }),
    ).toBeInTheDocument();
  });

  it("opens a stored log from /records/:logId", async () => {
    mocks.logs = [mocks.makeLog("a")];
    renderApp("/records/a");
    const title = mocks.formatTitle(mocks.logs[0]!);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      title,
    );
    expect(
      screen.getByRole("button", { name: "Share recording" }),
    ).toBeInTheDocument();
  });

  it("shows a not-found message for a missing log", async () => {
    mocks.logs = [];
    renderApp("/records/missing");
    expect(await screen.findByText("Recording not found.")).toBeInTheDocument();
  });
});
