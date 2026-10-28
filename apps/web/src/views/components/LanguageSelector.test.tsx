import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { LanguageSelector } from "./LanguageSelector";

function renderSelect(value = "en-US") {
  const onChange = vi.fn();
  render(<LanguageSelector value={value} onChange={onChange} />);
  const trigger = screen.getByRole("combobox", {
    name: "Transcription language",
  });
  const searchBox = () => screen.getByPlaceholderText("Search languages");
  const openPopup = () => fireEvent.click(trigger);
  const option = (name: RegExp) => screen.getByRole("option", { name });
  return { onChange, openPopup, searchBox, option };
}

test("shows the selected native label on the trigger", () => {
  renderSelect("de-DE");
  const trigger = screen.getByRole("combobox", {
    name: "Transcription language",
  });
  expect(trigger).toHaveTextContent("Deutsch");
});

test("opens a list of possible languages", () => {
  const { openPopup, option } = renderSelect();
  openPopup();
  expect(screen.getByRole("listbox")).toBeInTheDocument();
  expect(option(/Deutsch/)).toBeInTheDocument();
  expect(option(/Русский/)).toBeInTheDocument();
});

test("search filters by native name, ignoring diacritics", () => {
  const { openPopup, searchBox, option } = renderSelect();
  openPopup();
  fireEvent.change(searchBox(), { target: { value: "franc" } });
  expect(option(/Français/)).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: /Deutsch/ }),
  ).not.toBeInTheDocument();
});

test("search matches the English name too (chinese → 中文)", () => {
  const { openPopup, searchBox, option } = renderSelect();
  openPopup();
  fireEvent.change(searchBox(), { target: { value: "chinese" } });
  expect(option(/Chinese/)).toBeInTheDocument();
});

test("clicking an option selects its code and closes the list", () => {
  const { onChange, openPopup, option } = renderSelect();
  openPopup();
  fireEvent.click(option(/Deutsch/));
  expect(onChange).toHaveBeenCalledWith("de-DE");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("Enter selects the active search result", () => {
  const { onChange, openPopup, searchBox } = renderSelect();
  openPopup();
  fireEvent.change(searchBox(), { target: { value: "swedish" } });
  fireEvent.keyDown(searchBox(), { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith("sv-SE");
});

test("Escape closes the list", () => {
  const { openPopup, searchBox } = renderSelect();
  openPopup();
  fireEvent.keyDown(searchBox(), { key: "Escape" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("an unknown search shows an empty state", () => {
  const { openPopup, searchBox } = renderSelect();
  openPopup();
  fireEvent.change(searchBox(), { target: { value: "zzz" } });
  expect(screen.getByText(/No languages match/i)).toBeInTheDocument();
});
