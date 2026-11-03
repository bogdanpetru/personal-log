import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadLocale } from "@/lib/i18n/i18n";
import { settingsService } from "@/lib/settingsService";
import { whisperTranscriber } from "@/lib/transcription/whisperTranscriber";
import { SettingsView } from "./SettingsView";

vi.mock("@/lib/transcription/whisperTranscriber", () => ({
  whisperTranscriber: {
    ensureReady: vi.fn(),
    offload: vi.fn(),
  },
}));

const ensureReady = vi.mocked(whisperTranscriber.ensureReady);
const offload = vi.mocked(whisperTranscriber.offload);

beforeEach(async () => {
  settingsService.reset();
  ensureReady.mockReset();
  ensureReady.mockResolvedValue(undefined);
  offload.mockReset();
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  await loadLocale("en");
});

function renderSettings() {
  render(
    <MemoryRouter>
      <SettingsView />
    </MemoryRouter>,
  );
}

describe("SettingsView", () => {
  it("shows the app language, theme, transcription and download sections", () => {
    renderSettings();
    expect(
      screen.getByRole("heading", { name: "App language" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Theme" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Transcription language" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Download format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Backup" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export zip" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore zip" })).toBeInTheDocument();
  });

  it("persists the chosen theme", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(settingsService.get().theme).toBe("dark");
  });

  it("shows the stored download format", () => {
    renderSettings();
    expect(
      screen.getByRole("combobox", { name: "Download format" }),
    ).toHaveTextContent("Original");
  });

  it("persists a new download format", () => {
    renderSettings();
    fireEvent.pointerDown(
      screen.getByRole("combobox", { name: "Download format" }),
      { pointerType: "mouse", button: 0 },
    );
    fireEvent.click(screen.getByRole("option", { name: "MP3" }));
    expect(settingsService.get().downloadFormat).toBe("mp3");
  });

  it("switches the interface language and loads its chunk", async () => {
    renderSettings();
    fireEvent.click(screen.getByRole("combobox", { name: "App language" }));
    fireEvent.click(screen.getByText("Română"));
    expect(settingsService.get().locale).toBe("ro");
    expect(
      await screen.findByRole("heading", { name: "Limba aplicației" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("ro");
  });

  it("persists the chosen transcription engine", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Whisper" }));
    expect(settingsService.get().transcriptionEngine).toBe("whisper");
    fireEvent.click(screen.getByRole("button", { name: "Native" }));
    expect(settingsService.get().transcriptionEngine).toBe("native");
  });

  it("downloads the whisper model once per visit and shows the ready state", async () => {
    ensureReady.mockResolvedValue(undefined);
    renderSettings();
    expect(ensureReady).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Whisper" }));
    expect(await screen.findByText("Model downloaded — running locally")).toBeInTheDocument();
    expect(ensureReady).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Native" }));
    fireEvent.click(screen.getByRole("button", { name: "Whisper" }));
    expect(ensureReady).toHaveBeenCalledTimes(1);
  });

  it("shows the download progress while the whisper model loads", async () => {
    ensureReady.mockImplementation((onProgress) => {
      onProgress?.(0.4);
      return new Promise<void>(() => {});
    });
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Whisper" }));
    expect(await screen.findByRole("progressbar")).toBeInTheDocument();
    const indicator = screen
      .getByRole("progressbar")
      .querySelector('[data-slot="progress-indicator"]');
    expect(indicator).not.toBeNull();
    expect(indicator).toHaveStyle({ transform: "translateX(-60%)" });
    expect(screen.getByRole("button", { name: "Native" })).toBeInTheDocument();
  });

  it("surfaces a failed download and keeps whisper selectable for a retry", async () => {
    ensureReady.mockRejectedValue(new Error("offline"));
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Whisper" }));
    expect(
      await screen.findByText("Download failed. The Web engine is still available."),
    ).toBeInTheDocument();
    expect(settingsService.get().transcriptionEngine).toBe("whisper");
    expect(screen.getByRole("button", { name: "Native" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Native" }));
    expect(settingsService.get().transcriptionEngine).toBe("native");
  });
});
