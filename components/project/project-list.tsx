"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, FolderLibraryIcon } from "@hugeicons/core-free-icons";

import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectDTO } from "@/types/dto";

interface ProjectListProps {
  readonly workspaceId: string;
  readonly projects: readonly ProjectDTO[];
  readonly canCreate: boolean;
  readonly canDelete: boolean;
}

export function ProjectList({
  workspaceId,
  projects,
  canCreate,
  canDelete,
}: ProjectListProps) {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) =>
      project.name.toLowerCase().includes(query)
    );
  }, [projects, search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
          />
        </div>

        {canCreate ? (
          <Button onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New project
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <HugeiconsIcon icon={FolderLibraryIcon} strokeWidth={2} className="size-8" />
          }
          title={search ? "No matching projects" : "No projects yet"}
          description={
            search
              ? "Try a different search term."
              : canCreate
                ? "Create your first project to get a Kanban board."
                : "You will see projects here once an admin creates one."
          }
          action={
            !search && canCreate ? (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                Create project
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} canDelete={canDelete} />
            </li>
          ))}
        </ul>
      )}

      <CreateProjectDialog
        workspaceId={workspaceId}
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
      />
    </section>
  );
}
