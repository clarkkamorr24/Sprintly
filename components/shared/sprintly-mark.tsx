import Image from "next/image";

import { cn } from "@/lib/utils";

interface SprintlyMarkProps {
  readonly className?: string;
  readonly size?: number;
}

export function SprintlyMark({ className, size = 22 }: SprintlyMarkProps) {
  return (
    <Image
      src="/sprintly_logo.png"
      alt=""
      aria-hidden
      width={437}
      height={405}
      priority
      className={cn("w-auto shrink-0 object-contain", className)}
      style={{ height: size }}
    />
  );
}
