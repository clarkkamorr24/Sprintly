import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/types/dto";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface UserAvatarProps {
  readonly user: Pick<UserDTO, "name" | "avatarUrl">;
  readonly size?: "sm" | "default" | "lg";
  readonly className?: string;
}

export function UserAvatar({ user, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      {user.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt="" />
      ) : null}
      <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
        {initialsOf(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
