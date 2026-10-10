import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      {children}
    </main>
  );
}