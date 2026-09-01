"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { deleteProjectAction } from "@/app/actions/project-actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectActionsMenuProps {
  readonly projectId: string;
  readonly projectName: string;
  readonly redirectTo?: string;
}

export function ProjectActionsMenu({
  projectId,
  projectName,
  redirectTo,
}: ProjectActionsMenuProps) {
  const router = useRouter();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectAction({ projectId });

      if (!result.success) {
        setConfirmOpen(false);
        toast.error(result.error.message);
        return;
      }

      setConfirmOpen(false);
      toast.success(`Project "${projectName}" deleted.`);

      if (redirectTo) {
        router.replace(redirectTo);
      }

      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${projectName}`}
              className="relative z-10 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              Delete project
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${projectName}"?`}
        description="Are you sure you want to delete this project? This action cannot be undone. Its board, issues, sprints, and comments will be permanently removed."
        confirmLabel="Delete project"
        isPending={isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
