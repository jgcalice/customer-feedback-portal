"use client";

import { useI18n } from "@/i18n/LocaleProvider";

type Status =
  | "new"
  | "evaluating"
  | "planned"
  | "in_progress"
  | "delivered"
  | (string & {});

const STATUS_KEYS: Record<string, string> = {
  new: "status.new",
  evaluating: "status.evaluating",
  planned: "status.planned",
  in_progress: "status.in_progress",
  delivered: "status.delivered",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-secondary text-secondary-foreground border-border",
  evaluating: "bg-accent text-accent-foreground border-border",
  planned: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-card text-card-foreground border-primary/50",
  delivered: "bg-primary/10 text-primary border-primary/70",
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status] ?? "bg-muted text-muted-foreground border-border"}`}
    >
      {STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : status}
    </span>
  );
}
