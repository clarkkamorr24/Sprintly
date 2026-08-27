import { avatarTone } from "@/lib/issue-display";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/types/dto";

const SIZE = {
  xs: "size-5 text-[9px]",
  sm: "size-[22px] text-[9px]",
  md: "size-[26px] text-[10px]",
  lg: "size-7 text-[11px]",
} as const;

interface InitialsTileProps {
  readonly user: Pick<UserDTO, "id" | "name">;
  readonly size?: keyof typeof SIZE;
  readonly className?: string;
}

export function InitialsTile({ user, size = "sm", className }: InitialsTileProps) {
  return (
    <span
      title={user.name}
      className={cn(
        "flex shrink-0 items-center justify-center font-extrabold text-[var(--sp-bg)]",
        SIZE[size],
        className
      )}
      style={{ background: avatarTone(user.id) }}
    >
      {initialsOf(user.name)}
    </span>
  );
}
