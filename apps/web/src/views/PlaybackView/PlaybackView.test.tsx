import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlaybackView } from "./PlaybackView";

describe("PlaybackView", () => {
  it("shows a play button and the total duration from the log", () => {
    render(<PlaybackView src="blob:mock" durationMs={5000} />);
    expect(
      screen.getByRole("button", { name: "Play recording" }),
    ).toBeInTheDocument();
    expect(screen.getByText("/ 0:05")).toBeInTheDocument();
  });

  it("seeks the recording from the keyboard", () => {
    render(<PlaybackView src="blob:mock" durationMs={5000} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "1");
  });

  it("disables seeking until a duration is known", () => {
    render(<PlaybackView src="blob:mock" />);
    expect(screen.getByRole("slider")).toHaveAttribute(
      "data-disabled",
      "",
    );
  });
});
