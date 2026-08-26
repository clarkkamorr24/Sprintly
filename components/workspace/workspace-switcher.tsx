"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceDTO } from "@/types/dto";

interface WorkspaceSwitcherProps {
  readonly workspaces: readonly WorkspaceDTO[];
  readonly activeWorkspaceId: string;
  readonly onCreate: () => void;
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onCreate,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="max-w-56">
            <span className="truncate">{active?.name ?? "Select workspace"}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              data-icon="inline-end"
            />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => router.push(`/workspaces/${workspace.id}`)}
            >
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.id === activeWorkspaceId ? (
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
