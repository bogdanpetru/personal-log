import { describe, expect, it } from "vitest";
import en from "./messages/en";
import ro from "./messages/ro";
import { translate } from "./translate";

describe("translate", () => {
  it("returns the message for the key", () => {
    expect(translate(en, "nav.back")).toBe("Back");
    expect(translate(ro, "nav.back")).toBe("Înapoi");
  });

  it("interpolates parameters", () => {
    expect(
      translate(en, "theme.switch", { current: "Dark", next: "System" }),
    ).toBe("Theme: Dark. Switch to System.");
  });

  it("keeps a placeholder when the parameter is missing", () => {
    expect(translate(en, "theme.switch")).toBe(
      "Theme: {current}. Switch to {next}.",
    );
  });

  it("falls back to English for missing translations", () => {
    expect(translate({}, "nav.new")).toBe("New");
  });
});
