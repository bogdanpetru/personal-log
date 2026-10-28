import type { ReactNode } from "react";

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col px-4 pt-4">
      {header !== undefined && (
        <header className="flex w-full items-center justify-between px-2 py-2">
          {header}
        </header>
      )}
      <main className="mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col items-center gap-6 mt-6 px-6 pt-8 pb-6">
        {children}
      </main>
    </div>
  );
}
