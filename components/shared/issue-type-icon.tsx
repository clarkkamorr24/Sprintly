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

const SIZES = {
  sm: { box: "size-[15px]", glyph: "size-[13px]" },
  lg: { box: "size-[22px]", glyph: "size-[20px]" },
} as const;

interface IssueTypeIconProps {
  readonly type: IssueType;
  readonly size?: keyof typeof SIZES;
  readonly className?: string;
}

export function IssueTypeIcon({
  type,
  size = "sm",
  className,
}: IssueTypeIconProps) {
  const label = ISSUE_TYPE_LABEL[type];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={label}
            className={cn(
              "flex shrink-0 items-center justify-center",
              SIZES[size].box,
              className
            )}
            style={{ color: ISSUE_TYPE_COLOR[type] }}
          >
            <HugeiconsIcon
              icon={ISSUE_TYPE_ICON[type]}
              strokeWidth={2}
              className={SIZES[size].glyph}
            />
          </span>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
