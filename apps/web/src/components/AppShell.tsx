import type { ReactNode } from "react";

interface AppShellProps {
  /** Header-bar content: language selector; plus the stop button while recording. */
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex w-full items-center justify-between border-b border-border px-4 py-2">
        {header}
      </header>
      <main className="flex min-h-0 flex-1 flex-col items-center gap-6 px-5 py-5">
        {children}
      </main>
    </div>
  );
}