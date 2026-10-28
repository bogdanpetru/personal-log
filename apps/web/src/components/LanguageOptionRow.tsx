import { Check } from "lucide-react";
import { ListItem } from "@/components/ListItem";
import { Text } from "@/components/Text";

interface LanguageOptionRowProps {
  id: string;
  label: string;
  english: string;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onHighlight: () => void;
}

export function LanguageOptionRow({
  id,
  label,
  english,
  active,
  selected,
  onSelect,
  onHighlight,
}: LanguageOptionRowProps) {
  return (
    <ListItem
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      className={`cursor-pointer flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 ${active ? "bg-muted" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onMouseMove={onHighlight}
    >
      <Text as="span" size="sm" className="truncate">
        {label}
      </Text>
      {selected && (
        <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
      )}
      <Text as="span" size="xs" muted className="shrink-0">
        {english}
      </Text>
    </ListItem>
  );
}