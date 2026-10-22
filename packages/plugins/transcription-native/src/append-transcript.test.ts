import { describe, expect, it } from "vitest";
import { appendTranscript } from "@personal-log/plugin-api";

// plugin-api has no test infrastructure of its own, so the shared append rule
// is exercised here — this package owns the vitest setup and already depends
// on the API package.
describe("appendTranscript", () => {
  it("joins with a space by default", () => {
    expect(appendTranscript("hello world", "how are you")).toBe(
      "hello world how are you",
    );
  });

  it("returns the next text when the base is empty", () => {
    expect(appendTranscript("", "hello")).toBe("hello");
  });

  it("returns the base unchanged when the next text is empty", () => {
    expect(appendTranscript("hello", "")).toBe("hello");
  });

  it("joins directly after a paragraph break", () => {
    expect(appendTranscript("hello world\n", "how are you")).toBe(
      "hello world\nhow are you",
    );
  });

  it("drops a full repeat of the committed text", () => {
    expect(appendTranscript("hello world", "world")).toBe("hello world");
    expect(appendTranscript("hello world", "hello world")).toBe("hello world");
  });

  it("trims a long overlap with the committed tail", () => {
    // Engine re-delivery: the new text restates ≥ 12 committed characters first.
    expect(
      appendTranscript("the cat sat on the mat", "the cat sat on the mat again"),
    ).toBe("the cat sat on the mat again");
  });

  it("keeps a short legit repeat of a phrase", () => {
    // The overlap is a common short phrase start — not a re-delivery.
    expect(appendTranscript("the cat", "the cat sat")).toBe(
      "the cat the cat sat",
    );
  });

  it("trims any overlap when a caller knows re-delivery just happened", () => {
    // The plugin folds a just-restarted run whose first segment restates the
    // committed tail — even a short one.
    expect(appendTranscript("one two", "one two three", 1)).toBe(
      "one two three",
    );
    expect(appendTranscript("hello", "hello world", 1)).toBe("hello world");
  });
});