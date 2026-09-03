"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserDTO } from "@/types/dto";

export const UNASSIGNED = "unassigned";

interface AssigneeSelectProps {
  readonly members: readonly UserDTO[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly size?: "sm";
  readonly className?: string;
}

export function AssigneeSelect({
  members,
  value,
  onValueChange,
  disabled,
  id,
  size,
  className,
}: AssigneeSelectProps) {
  const items = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ];

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} size={size} aria-label="Assignee" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
