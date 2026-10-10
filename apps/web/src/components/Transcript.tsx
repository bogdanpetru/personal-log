interface TranscriptProps {
  transcript: string;
  partial: string;
}

export function Transcript({ transcript, partial }: TranscriptProps) {
  if (transcript === "" && partial === "") {
    return null;
  }
  return (
    <p className="max-w-prose whitespace-pre-wrap text-center">
      {transcript}
      {partial !== "" && (
        <span className="text-muted-foreground"> {partial}</span>
      )}
    </p>
  );
}