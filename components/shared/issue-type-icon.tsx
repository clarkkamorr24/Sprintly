import { HugeiconsIcon } from "@hugeicons/react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IssueType } from "@/lib/generated/prisma/enums";
import {
  ISSUE_TYPE_COLOR,
  ISSUE_TYPE_ICON,
  ISSUE_TYPE_LABEL,
} from "@/lib/issue-display";
import { cn } from "@/lib/utils";

interface IssueTypeIconProps {
  readonly type: IssueType;
  readonly className?: string;
}

export function IssueTypeIcon({ type, className }: IssueTypeIconProps) {
  const label = ISSUE_TYPE_LABEL[type];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className={cn(
              "flex size-[15px] shrink-0 items-center justify-center",
              className
            )}
            style={{ color: ISSUE_TYPE_COLOR[type] }}
          >
            <HugeiconsIcon
              icon={ISSUE_TYPE_ICON[type]}
              strokeWidth={2}
              className="size-[13px]"
            />
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
