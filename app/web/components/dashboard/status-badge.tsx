"use client";

import { cn } from "@/lib/utils";

export type IssueStatus = "Pending" | "Approved" | "Rejected";

interface StatusBadgeProps {
  status: IssueStatus;
}

const statusStyles: Record<IssueStatus, string> = {
  Pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Approved: "bg-green-500/15 text-green-400 border-green-500/30",
  Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
