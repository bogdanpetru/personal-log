import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "./ShareButton";

const file = new File(["recording"], "personal-log-2025-01-01_10-00-00.webm", {
  type: "audio/webm",
});

beforeEach(() => {
  Object.assign(URL, {
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderShareButton(busy = false) {
  render(<ShareButton file={file} busy={busy} />);
}

describe("ShareButton", () => {
  it("renders with an accessible name", () => {
    renderShareButton();
    expect(
      screen.getByRole("button", { name: "Share recording" }),
    ).toBeInTheDocument();
  });

  it("is disabled while the file is being prepared", () => {
    renderShareButton(true);
    const button = screen.getByRole("button", { name: "Share recording" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("saves the file when sharing files is unsupported", () => {
    vi.stubGlobal("navigator", { canShare: undefined, share: undefined });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    renderShareButton();
    fireEvent.click(screen.getByRole("button", { name: "Share recording" }));
    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe(file.name);
    expect(anchor.href).toBe("blob:mock");
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
        files: [file],
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
