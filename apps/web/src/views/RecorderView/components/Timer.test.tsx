import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Timer } from "./Timer";

test("formats whole minutes and seconds", () => {
  render(<Timer seconds={65} />);
  expect(screen.getByRole("timer")).toHaveTextContent("1:05");
});

test("pads seconds below ten", () => {
  render(<Timer seconds={7} />);
  expect(screen.getByRole("timer")).toHaveTextContent("0:07");
});

test("renders as a div", () => {
  render(<Timer seconds={65} />);
  expect(screen.getByRole("timer").tagName).toBe("DIV");
});