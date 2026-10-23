import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/Input";

interface LanguageSearchFieldProps extends ComponentProps<"input"> {}

export function LanguageSearchField(props: LanguageSearchFieldProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <Search
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <Input
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="Search languages"
        className="h-auto border-none rounded-none bg-transparent px-0 py-0 text-sm md:text-sm dark:bg-transparent focus-visible:border-none focus-visible:ring-0"
        {...props}
      />
    </div>
  );
}