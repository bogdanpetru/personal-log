import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the record button", () => {
  render(<App />);
  expect(
    screen.getByRole("button", { name: "Start recording" }),
  ).toBeInTheDocument();
});

test("record button is disabled when transcription is unsupported (jsdom)", () => {
  render(<App />);
  expect(
    screen.getByRole("button", { name: "Start recording" }),
  ).toBeDisabled();
});

test("pause button is not visible before recording", () => {
  render(<App />);
  expect(
    screen.queryByRole("button", { name: "Pause recording" }),
  ).not.toBeInTheDocument();
});

test("no stop button before recording", () => {
  render(<App />);
  expect(
    screen.queryByRole("button", { name: "Stop recording" }),
  ).not.toBeInTheDocument();
});

test("language selector defaults to the browser language (jsdom en-US)", () => {
  render(<App />);
  const trigger = screen.getByRole("combobox", {
    name: "Transcription language",
  });
  expect(trigger).toHaveTextContent("English");
});

test("shows no recording indicator text", () => {
  render(<App />);
  expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
});