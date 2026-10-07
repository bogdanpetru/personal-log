import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/useRecorder";

export default function App() {
  const { status, transcript, partial, supported, start, stop } =
    useRecorder();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {status === "recording" && (
        <p className="animate-pulse text-sm text-red-500">recording</p>
      )}
      <Button
        onClick={() => (status === "recording" ? stop() : void start())}
        disabled={!supported}
      >
        {status === "recording" ? "Listening" : "Start"}
      </Button>
      {(transcript !== "" || partial !== "") && (
        <p className="max-w-prose whitespace-pre-wrap text-center">
          {transcript}
          {partial !== "" && (
            <span className="text-muted-foreground"> {partial}</span>
          )}
        </p>
      )}
    </main>
  );
}
