import { UserAvatar } from "@/components/shared/user-avatar";
import { describeActivity } from "@/lib/activity-text";
import type { ActivityEntryDTO } from "@/types/dto";
import { RelativeTime } from "@/components/shared/relative-time";

interface RecentActivityProps {
  readonly entries: readonly ActivityEntryDTO[];
}

export function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Recent activity</h2>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No activity in this workspace yet.
        </p>
      ) : (
        <ol className="mt-3 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-2.5">
              <UserAvatar user={entry.actor} size="sm" className="mt-0.5" />

              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {entry.actor.name}
                </span>{" "}
                {describeActivity(entry)}
                {entry.project ? (
                  <span className="text-muted-foreground">
                    {" "}
                    in {entry.project.name}
                  </span>
                ) : null}{" "}
                <time
                  dateTime={entry.createdAt}
                  className="whitespace-nowrap text-xs"
                >
                  <RelativeTime iso={entry.createdAt} />
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
