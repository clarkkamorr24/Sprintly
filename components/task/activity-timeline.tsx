"use client";

import { useState } from "react";
import { toast } from "sonner";

import { listTaskActivityAction } from "@/app/actions/task-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { describeActivity } from "@/lib/activity-text";
import type { ActivityEntryDTO } from "@/types/dto";
import { RelativeTime } from "@/components/shared/relative-time";

interface ActivityTimelineProps {
  readonly taskId: string;
  readonly entries: readonly ActivityEntryDTO[];
  readonly total: number;
}

export function ActivityTimeline({
  taskId,
  entries,
  total,
}: ActivityTimelineProps) {
  const [extra, setExtra] = useState<readonly ActivityEntryDTO[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setLoading] = useState(false);

  const all = [...entries, ...extra];
  const hasMore = all.length < total;

  const loadMore = async () => {
    setLoading(true);

    const result = await listTaskActivityAction({ taskId, page: page + 1 });

    setLoading(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    setExtra((current) => [...current, ...result.data.items]);
    setPage((current) => current + 1);
  };

  if (all.length === 0) {
    return (
      <section className="space-y-3">
        <h3 className="sp-section-label">Activity</h3>
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="sp-section-label">Activity</h3>

      <ol className="space-y-3">
        {all.map((entry) => (
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

      {hasMore ? (
        <div className="flex items-center gap-3 justify-center px-6 mt-5">
          <Button
            className="w-full rounded-full text-primary"
            size="sm"
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
