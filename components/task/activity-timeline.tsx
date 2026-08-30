import { UserAvatar } from "@/components/shared/user-avatar";
import { describeActivity } from "@/lib/activity-text";
import type { ActivityEntryDTO } from "@/types/dto";
import { RelativeTime } from "@/components/shared/relative-time";

interface ActivityTimelineProps {
  readonly entries: readonly ActivityEntryDTO[];
  readonly total: number;
}

export function ActivityTimeline({ entries, total }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Activity</h3>
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Activity</h3>

      <ol className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <UserAvatar user={entry.actor} size="sm" className="mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {entry.actor.name}
              </span>{" "}
              {describeActivity(entry)}{" "}
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

      {total > entries.length ? (
        <p className="text-xs text-muted-foreground">
          Showing the {entries.length} most recent of {total} events.
        </p>
      ) : null}
    </section>
  );
}
