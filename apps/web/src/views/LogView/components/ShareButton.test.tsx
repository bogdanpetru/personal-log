import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";
import type { Log } from "@personal-log/plugin-api";

const log: Log = {
  id: "a",
  createdAt: "2025-01-01T10:00:00.000Z",
  durationMs: 1000,
  audio: {
    id: "a-audio",
    mimeType: "audio/webm",
    size: 10,
    createdAt: "2025-01-01T10:00:00.000Z",
  },
  transcriptions: [],
};

const audio = new Blob(["recording"], { type: "audio/webm" });
const audioUrl = "blob:mock";

function renderShareButton() {
  render(<ShareButton log={log} audio={audio} audioUrl={audioUrl} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ShareButton", () => {
  it("renders with an accessible name", () => {
    renderShareButton();
    expect(
      screen.getByRole("button", { name: "Share recording" }),
    ).toBeInTheDocument();
  });

  it("saves the file when sharing files is unsupported", () => {
    vi.stubGlobal("navigator", { canShare: undefined, share: undefined });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share recording" }));
    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(
      /^personal-log-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.webm$/,
    );
    expect(anchor.href).toBe(audioUrl);
  });

  it("shares the file when the share sheet accepts files", () => {
    const share = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", {
      canShare: () => true,
      share,
    });
    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share recording" }));
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [expect.any(File)],
      }),
    );
  });

  it("does not download when the user cancels the share sheet", async () => {
    const share = vi.fn(async () => {
      throw new DOMException("cancel", "AbortError");
    });
    vi.stubGlobal("navigator", { canShare: () => true, share });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share recording" }));
    await vi.waitFor(() => expect(share).toHaveBeenCalled());
    expect(click).not.toHaveBeenCalled();
  });
});