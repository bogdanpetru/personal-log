import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/Input";
import { Text } from "@/components/Text";

interface RecordingTitleProps {
  title: string;
  onCommit: (title: string) => void;
}

export function RecordingTitle({ title, onCommit }: RecordingTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== "" && trimmed !== title) {
      onCommit(trimmed);
    }
  };

  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
          } else if (event.key === "Escape") {
            cancel();
          }
        }}
        onBlur={commit}
        aria-label="Recording title"
      />
    );
  }

  return (
    <Text
      as="h1"
      size="title"
      onClick={() => setEditing(true)}
      className="cursor-pointer self-start transition-opacity hover:opacity-70"
    >
      {title}
    </Text>
  );
}