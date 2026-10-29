import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import { Link } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useTranslation } from "@/hooks/useTranslation";
import { logTitle } from "@/lib/logTitle";
import type { Log, LogId } from "@personal-log/plugin-api";

interface LogListViewProps {
  logs: Log[];
  onDelete: (logId: LogId) => Promise<void>;
}

interface DayGroup {
  day: string;
  logs: Log[];
}

function formatDay(log: Log): string {
  const date = new Date(log.createdAt);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function groupByDay(logs: Log[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const log of logs) {
    const day = formatDay(log);
    const current = groups[groups.length - 1];
    if (current !== undefined && current.day === day) {
      current.logs.push(log);
    } else {
      groups.push({ day, logs: [log] });
    }
  }
  return groups;
}

export function LogListView({ logs, onDelete }: LogListViewProps) {
  const { t } = useTranslation();
  const [pendingId, setPendingId] = useState<LogId | null>(null);
  const groups = groupByDay(logs);

  const confirmDelete = useCallback(async () => {
    if (pendingId === null) {
      return;
    }
    await onDelete(pendingId);
    setPendingId(null);
  }, [pendingId, onDelete]);

  return (
    <>
      <ul className="flex w-full flex-col">
        {groups.map((group, index) => (
          <li key={group.day} className={index > 0 ? "pt-6" : undefined}>
            <Text as="h2" size="xs" muted>
              {group.day}
            </Text>
            <ul className="mt-1 flex flex-col">
              {group.logs.map((log) => (
                <li
                  key={log.id}
                  className="group grid grid-cols-[1fr_auto] items-center"
                >
                  <Link to={`/records/${log.id}`} className="py-3">
                    <Text as="span" size="base" className="text-foreground">
                      {logTitle(log)}
                    </Text>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("list.delete")}
                    className="text-muted-foreground opacity-100 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={() => {
                      setPendingId(log.id);
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={pendingId !== null}
        onOpenChange={() => setPendingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("list.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("list.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("list.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t("list.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
