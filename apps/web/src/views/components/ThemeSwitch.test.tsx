import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { settingsService } from "@/lib/settingsService";
import { ThemeSwitch } from "./ThemeSwitch";

beforeEach(() => {
  settingsService.reset();
  document.documentElement.classList.remove("dark");
});

describe("ThemeSwitch", () => {
  it("starts from the system mode", () => {
    render(<ThemeSwitch />);
    expect(
      screen.getByRole("button", { name: /Theme: System/ }),
    ).toBeInTheDocument();
  });

  it("cycles system → light → dark → system", () => {
    render(<ThemeSwitch />);
    fireEvent.click(screen.getByRole("button", { name: /Theme: System/ }));
    expect(settingsService.get().theme).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: /Theme: Light/ }));
    expect(settingsService.get().theme).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: /Theme: Dark/ }));
    expect(settingsService.get().theme).toBe("system");
  });

  it("applies the chosen theme to the document", () => {
    render(<ThemeSwitch />);
    fireEvent.click(screen.getByRole("button", { name: /Theme: System/ }));
    fireEvent.click(screen.getByRole("button", { name: /Theme: Light/ }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Theme: Dark/ }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
