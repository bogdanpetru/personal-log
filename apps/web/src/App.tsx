import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/useRecorder";
import { useTranscription } from "@/hooks/useTranscription";

export default function App() {
  const { status, start: startRecording, stop: stopRecording } =
    useRecorder();
  const {
    transcript,
    partial,
    supported,
    start: startTranscription,
    stop: stopTranscription,
  } = useTranscription();

  const recording = status === "recording";

  const start = async () => {
    await startRecording();
    try {
      await startTranscription();
    } catch (error) {
      stopRecording();
      throw error;
    }
  };

  const handleToggle = () => {
    if (recording) {
      stopTranscription();
      stopRecording();
    } else {
      void start();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {recording && (
        <p className="animate-pulse text-sm text-red-500">recording</p>
      )}
      <Button onClick={handleToggle} disabled={!supported}>
        {recording ? "Listening" : "Start"}
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
