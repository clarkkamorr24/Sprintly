import Link from "next/link";

import { projectPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface OpenProjectLinkProps {
  readonly projectSlug: string;
  readonly workspaceSlug: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function OpenProjectLink({
  projectSlug,
  workspaceSlug,
  className,
  children,
}: OpenProjectLinkProps) {
  return (
    <Link
      href={projectPath(workspaceSlug, projectSlug, "board")}
      className={cn("text-left", className)}
    >
      {children}
    </Link>
  );
}
