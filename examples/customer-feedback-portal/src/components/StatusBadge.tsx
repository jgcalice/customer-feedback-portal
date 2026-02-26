"use client";

type Status =
  | "new"
  | "evaluating"
  | "planned"
  | "in_progress"
  | "delivered"
  | (string & {});

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  evaluating: "Evaluating",
  planned: "Planned",
  in_progress: "In progress",
  delivered: "Delivered",
};

const STATUS_CLASSES: Record<string, string> = {
  new: "bg-slate-100 text-slate-800 border-slate-200",
  evaluating: "bg-amber-100 text-amber-800 border-amber-200",
  planned: "bg-violet-100 text-violet-800 border-violet-200",
  in_progress: "bg-sky-100 text-sky-800 border-sky-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-200"}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
