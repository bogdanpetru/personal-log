import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { Waveform } from "./Waveform";

test("renders one bar per level", () => {
  const { container } = render(<Waveform levels={[0, 0.5, 1]} />);
  expect(container.querySelectorAll("rect")).toHaveLength(3);
});
