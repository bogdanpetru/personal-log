import type { ReactNode } from "react";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col p-4">
      <header className="flex w-full items-center justify-between px-2 py-2">
        {header}
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col items-center gap-6 mt-6 px-6 py-8">
        {children}
      </main>
    </div>
  );
}