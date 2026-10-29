import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { getSettings, resetSettings } from "@/lib/settings";
import { SettingsView } from "./SettingsView";

beforeEach(() => {
  resetSettings();
});

function renderSettings() {
  render(
    <MemoryRouter>
      <SettingsView />
    </MemoryRouter>,
  );
}

describe("SettingsView", () => {
  it("shows the theme, language and download format sections", () => {
    renderSettings();
    expect(
      screen.getByRole("heading", { name: "Theme" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Default language" }),
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
});
