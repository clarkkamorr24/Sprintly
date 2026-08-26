import { cn } from "@/lib/utils";

interface StatCardProps {
  readonly label: string;
  readonly value: number;
  readonly hint?: string;
  readonly emphasis?: "default" | "warning";
}

export function StatCard({
  label,
  value,
  hint,
  emphasis = "default",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          emphasis === "warning" && value > 0 && "text-destructive"
        )}
      >
        {value}
      </dd>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
