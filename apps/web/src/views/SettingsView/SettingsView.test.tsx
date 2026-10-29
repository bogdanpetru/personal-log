import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { loadLocale } from "@/lib/i18n/i18n";
import { getSettings, resetSettings } from "@/lib/settings";
import { SettingsView } from "./SettingsView";

beforeEach(async () => {
  resetSettings();
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
  });

  it("persists the chosen theme", () => {
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    expect(getSettings().theme).toBe("dark");
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
    expect(getSettings().downloadFormat).toBe("mp3");
  });

  it("switches the interface language and loads its chunk", async () => {
    renderSettings();
    fireEvent.click(screen.getByRole("combobox", { name: "App language" }));
    fireEvent.click(screen.getByText("Română"));
    expect(getSettings().locale).toBe("ro");
    expect(
      await screen.findByRole("heading", { name: "Limba aplicației" }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("ro");
  });
});
