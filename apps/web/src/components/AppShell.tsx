import type { ReactNode } from "react";

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col p-s3">
      {header !== undefined && (
        <header className="flex w-full items-center justify-between px-2 py-2">
          {header}
        </header>
      )}
      <main className="mx-auto flex min-h-0 w-full max-w-panel flex-1 flex-col items-center gap-s4 mt-s3 px-s4 py-s5">
        {children}
      </main>
    </div>
  );
}