"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

interface WorkspaceErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function WorkspaceError({ error, reset }: WorkspaceErrorProps) {
  useEffect(() => {
    console.error("Workspace route error:", error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <EmptyState
        title="This workspace could not be loaded"
        description="It may have been removed, or you may no longer have access to it."
        action={
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
        }
      />
    </main>
  );
}
