import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover";
import { Text } from "@/components/Text";

interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  value: string;
  options: ComboboxOption[];
  query: string;
  onQueryChange: (query: string) => void;
  onChange: (value: string) => void;
  label: string;
  searchPlaceholder: string;
  emptyLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Combobox({
  value,
  options,
  query,
  onQueryChange,
  onChange,
  label,
  searchPlaceholder,
  emptyLabel,
  placeholder,
  disabled = false,
  className,
  contentClassName,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const shown = selected?.label ?? placeholder ?? value;

  const close = () => {
    setOpen(false);
    onQueryChange("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
          variant="outline"
          className={cn("justify-between", className)}
        >
          <Text as="span" size="xs" className="min-w-0 truncate">
            {shown}
          </Text>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("overflow-hidden p-0", contentClassName)}
      >
        <Command shouldFilter={false}>
          <CommandInput
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={onQueryChange}
          />
          <CommandList>
            <CommandEmpty>
              <Text as="span" size="xs" muted>
                {emptyLabel}
              </Text>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onChange(option.value);
                    close();
                  }}
                >
                  <Text as="span" size="xs" className="min-w-0 truncate">
                    {option.label}
                    {option.description !== undefined && (
                      <Text as="span" size="xs" muted className="ml-2">
                        {option.description}
                      </Text>
                    )}
                  </Text>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
