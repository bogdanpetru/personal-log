import { describe, expect, it } from "vitest";
import { toWhisperLanguage } from "./toWhisperLanguage.js";

describe("toWhisperLanguage", () => {
  it("reduces BCP-47 tags with region subtags to the primary subtag", () => {
    expect(toWhisperLanguage("en-US")).toBe("en");
    expect(toWhisperLanguage("zh-CN")).toBe("zh");
    expect(toWhisperLanguage("pt-BR")).toBe("pt");
  });

  it("lowercases bare language codes", () => {
    expect(toWhisperLanguage("EN")).toBe("en");
  });

  it("keeps already-lowercased bare codes unchanged", () => {
    expect(toWhisperLanguage("en")).toBe("en");
  });
});
