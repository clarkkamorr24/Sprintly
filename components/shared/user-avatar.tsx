import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/types/dto";

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
