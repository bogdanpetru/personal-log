import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Transcript } from "./Transcript";

test("renders nothing while there is no text", () => {
  const { container } = render(<Transcript transcript="" partial="" />);
  expect(container).toBeEmptyDOMElement();
});

test("renders finals followed by the muted partial", () => {
  render(<Transcript transcript="hello there" partial="worl" />);
  expect(screen.getByText("worl")).toHaveClass("text-muted-foreground");
});

test("preserves newlines with pre-style wrapping, left-aligned", () => {
  const { container } = render(
    <Transcript transcript={"first\nsecond"} partial="" />,
  );
  const paragraph = container.querySelector("p");
  // textContent (not toHaveTextContent, which collapses whitespace) keeps the
  // literal line break.
  expect(paragraph?.textContent).toBe("first\nsecond");
  expect(paragraph).toHaveClass("whitespace-pre-wrap");
  expect(paragraph?.parentElement).toHaveClass("text-left");
});