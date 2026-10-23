import { Text } from "@/components/Text";

interface LanguageTagProps {
  label: string;
}

export function LanguageTag({ label }: LanguageTagProps) {
  return (
    <Text
      as="span"
      size="xs"
      className="rounded-full bg-muted px-s2 py-s1 text-foreground"
    >
      {label}
    </Text>
  );
}