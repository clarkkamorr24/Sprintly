import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

interface NoProjectStateProps {
  readonly workspaceSlug: string;
  readonly feature: string;
  readonly canCreate: boolean;
}

export function NoProjectState({
  workspaceSlug,
  feature,
  canCreate,
}: NoProjectStateProps) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 lg:px-6">
      <EmptyState
        title={`No projects in this workspace yet`}
        description={
          canCreate
            ? `${feature} belongs to a project. Create the first project to start planning work here.`
            : `${feature} belongs to a project, and this workspace does not have one yet. An admin can create the first project.`
        }
        action={
          canCreate ? (
            <Button
              nativeButton={false}
              render={
                <Link href={`/${workspaceSlug}/projects`}>
                  Create a project
                </Link>
              }
            />
          ) : null
        }
      />
    </main>
  );
}
