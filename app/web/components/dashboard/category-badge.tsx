"use client";

import { cn } from "@/lib/utils";

export type IssueCategory = "Heating" | "Plumbing" | "Electrical" | "Other";

interface CategoryBadgeProps {
  category: IssueCategory;
}

const categoryStyles: Record<IssueCategory, string> = {
  Heating: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Plumbing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Electrical: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Other: "bg-muted text-muted-foreground border-border",
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        categoryStyles[category]
      )}
    >
      {category}
    </span>
  );
}
