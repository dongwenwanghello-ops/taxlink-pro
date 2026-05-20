import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, ShieldCheck } from "lucide-react";
import { getAwardConfirmCopy } from "@/lib/clientBidEvaluation";

export default function AwardConfirmDialog({
  open,
  onOpenChange,
  professionalLabel,
  onConfirm,
  onReviewProfile,
  confirming = false,
}) {
  const [busy, setBusy] = useState(false);
  const copy = getAwardConfirmCopy({ professionalLabel });

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
      onOpenChange?.(false);
    } finally {
      setBusy(false);
    }
  };

  const isBusy = busy || confirming;

  return (
    <Dialog open={open} onOpenChange={(next) => !isBusy && onOpenChange?.(next)}>
      <DialogContent className="max-w-md rounded-2xl border-border/80 p-0 gap-0 overflow-hidden">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-5 text-white">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                {copy.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-teal-50/95 text-sm leading-relaxed">
              {copy.lead}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">{copy.body}</p>
          <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            {copy.trustNote}
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl w-full sm:flex-1"
            disabled={isBusy}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          {onReviewProfile && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl w-full sm:flex-1"
              disabled={isBusy}
              onClick={() => {
                onReviewProfile();
                onOpenChange?.(false);
              }}
            >
              Review profile first
            </Button>
          )}
          <Button
            type="button"
            className="rounded-xl w-full sm:flex-1 bg-teal-700 hover:bg-teal-800 gap-2"
            disabled={isBusy}
            onClick={handleConfirm}
          >
            <Award className="h-4 w-4" />
            {isBusy ? "Awarding…" : "Award project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
