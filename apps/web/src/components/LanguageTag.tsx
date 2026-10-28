import { Text } from "@/components/Text";

interface LanguageTagProps {
  label: string;
}

export function LanguageTag({ label }: LanguageTagProps) {
  return (
    <Text
      as="span"
      size="xs"
      className="rounded-full bg-muted px-3 py-1 text-foreground"
    >
      {label}
    </Text>
  );
}