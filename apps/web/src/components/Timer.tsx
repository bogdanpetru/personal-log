interface TimerProps {
  seconds: number;
}

function format(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function Timer({ seconds }: TimerProps) {
  return (
    <p role="timer" className="text-3xl tabular-nums">
      {format(seconds)}
    </p>
  );
}