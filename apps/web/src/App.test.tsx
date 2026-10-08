import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the start button", () => {
  render(<App />);
  const button = screen.getByRole("button", { name: "Start" });
  expect(button).toBeInTheDocument();
});

test("button is disabled when transcription is unsupported (jsdom)", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
});

test("shows no recording indicator before recording", () => {
  render(<App />);
  expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
});
