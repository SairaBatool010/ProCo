"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatsCard({ title, value, icon: Icon, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card className="bg-card border-border/70 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-3 text-center">
            <Skeleton className="mx-auto h-8 w-24" />
            <Skeleton className="mx-auto h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-6">
        <div className="text-center">
          <p className="text-4xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
