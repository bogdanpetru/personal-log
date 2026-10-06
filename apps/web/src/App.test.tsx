import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the start button", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
});

test("shows no recording indicator before recording", () => {
  render(<App />);
  expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
});
