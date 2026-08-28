"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { selectProjectAction } from "@/app/actions/project-actions";
import { cn } from "@/lib/utils";

interface OpenProjectLinkProps {
  readonly projectId: string;
  readonly workspaceSlug: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function OpenProjectLink({
  projectId,
  workspaceSlug,
  className,
  children,
}: OpenProjectLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const open = () => {
    startTransition(async () => {
      const result = await selectProjectAction({ projectId });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      router.push(`/workspaces/${workspaceSlug}/board`);
    });
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={isPending}
      className={cn("text-left", className)}
    >
      {children}
    </button>
  );
}
