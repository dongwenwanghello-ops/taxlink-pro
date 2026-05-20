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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveOwnerMessage } from "@/lib/ownerMessages";
import { MessageCircle, Send } from "lucide-react";

const PRESETS = {
  contact: {
    title: "Contact bidder",
    description: "Your message is saved securely. The professional will be notified when messaging is fully connected.",
    placeholder: "Hi — I'd like to discuss your quote and timeline before making a decision…",
  },
  more_info: {
    title: "Request more information",
    description: "Ask for clarification on scope, fees, or experience. Saved to your project thread.",
    placeholder: "Could you clarify what's included in your fee, and whether you have handled similar HMRC matters before?",
  },
};

export default function ContactBidderDialog({
  open,
  onOpenChange,
  project,
  bid,
  bidderLabel,
  type = "contact",
  onSubmitted,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const preset = PRESETS[type] || PRESETS.contact;

  const handleSubmit = () => {
    if (!message.trim() || !project?.id || !bid?.id) return;
    setSending(true);
    saveOwnerMessage({
      projectId: project.id,
      bidId: bid.id,
      bidderLabel,
      type,
      message,
    });
    setSending(false);
    setMessage("");
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-600" />
            {preset.title}
          </DialogTitle>
          <DialogDescription>
            {preset.description}
            {bidderLabel && (
              <span className="block mt-1 font-medium text-foreground">To: {bidderLabel}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="owner-message" className="text-xs text-muted-foreground">
            Message
          </Label>
          <Textarea
            id="owner-message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={preset.placeholder}
            className="text-sm resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl gap-2"
            disabled={sending || message.trim().length < 8}
            onClick={handleSubmit}
          >
            <Send className="h-4 w-4" />
            Send message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
