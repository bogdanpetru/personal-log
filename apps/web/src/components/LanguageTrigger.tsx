import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";

interface LanguageTriggerProps extends ComponentProps<"button"> {
  label: string;
  open: boolean;
  listId?: string;
  activeId?: string;
  onToggle: () => void;
}

export function LanguageTrigger({
  label,
  open,
  listId,
  activeId,
  onToggle,
  ...props
}: LanguageTriggerProps) {
  return (
    <Button
      type="button"
      role="combobox"
      aria-label="Transcription language"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-autocomplete="list"
      aria-controls={listId}
      aria-activedescendant={activeId}
      onClick={onToggle}
      className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[3px] border border-border bg-transparent px-3 text-foreground font-normal transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      {...props}
    >
      <Text as="span" size="sm" className="truncate text-foreground">
        {label}
      </Text>
      <ChevronDown
        aria-hidden="true"
        className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
      />
    </Button>
  );
}