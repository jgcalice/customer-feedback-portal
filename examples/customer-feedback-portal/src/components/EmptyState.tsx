import Link from "next/link";

type EmptyStateProps = {
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">
        {message}
        {actionLabel && actionHref && (
          <>
            {" "}
            <Link
              href={actionHref}
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              {actionLabel}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
