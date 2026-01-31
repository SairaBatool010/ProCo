"use client";

import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessBannerProps {
  onDismiss?: () => void;
}

export function SuccessBanner({ onDismiss }: SuccessBannerProps) {
  return (
    <div className="mx-4 mb-4 flex items-center justify-between gap-3 rounded-lg bg-success/15 border border-success/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <p className="text-sm font-medium text-foreground">
          Issue submitted! Your landlord will review shortly.
        </p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 hover:bg-success/10"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </div>
  );
}
