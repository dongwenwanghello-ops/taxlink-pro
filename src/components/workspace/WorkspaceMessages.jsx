import React, { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_TYPES } from "@/lib/workspaceStore";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeBadge = {
  document_request: "bg-amber-100 text-amber-800",
  clarification: "bg-blue-100 text-blue-800",
  progress_update: "bg-emerald-100 text-emerald-800",
  deadline_reminder: "bg-rose-100 text-rose-800",
  general: "bg-slate-100 text-slate-600",
};

export default function WorkspaceMessages({
  messages = [],
  userRole,
  onSend,
  disabled = false,
  canSend = true,
}) {
  const [text, setText] = useState("");
  const [messageType, setMessageType] = useState("general");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const inputLocked = Boolean(disabled);
  const hasText = text.trim().length > 0;
  const canSendMessage = Boolean(onSend) && canSend !== false && !inputLocked && hasText && !sending;

  const handleSend = async () => {
    if (!canSendMessage) return;
    setSending(true);
    setSendError(null);
    try {
      const type = messageType || "general";
      await onSend(text.trim(), type);
      setText("");
    } catch (err) {
      console.warn("[WorkspaceMessages] send failed", err);
      setSendError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const updateText = (value) => {
    setText(value);
    if (sendError) setSendError(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white flex flex-col h-[460px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <MessageSquare className="h-4 w-4 text-teal-600" />
        <h3 className="text-sm font-bold text-slate-900">Work messages</h3>
        <span className="text-xs text-slate-500 ml-auto">Professional collaboration</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            Start the conversation — send a message to your {userRole === "client" ? "professional" : "client"}.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_role === userRole;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                    isMine ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-[11px] font-semibold opacity-80">{msg.sender_name}</p>
                    {msg.message_type && msg.message_type !== "general" && (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold", typeBadge[msg.message_type] || typeBadge.general)}>
                        {msg.message_type_label || msg.message_type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  <p className={cn("text-[10px] mt-1.5", isMine ? "text-teal-100" : "text-slate-500")}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-100 space-y-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
          Message type <span className="font-normal normal-case text-slate-400">(optional)</span>
        </label>
        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value)}
          disabled={inputLocked}
          className="w-full h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white"
        >
          {MESSAGE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <Textarea
          value={text}
          onChange={(e) => updateText(e.target.value)}
          onInput={(e) => updateText(e.target.value)}
          placeholder="Type your message…"
          rows={2}
          disabled={inputLocked}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canSendMessage) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        {sendError && (
          <p className="text-xs text-rose-600">{sendError}</p>
        )}
        {inputLocked && (
          <p className="text-xs text-slate-500">Messaging is closed for completed workspaces.</p>
        )}
        <Button
          type="button"
          size="sm"
          className="w-full gap-2"
          disabled={!canSendMessage}
          onClick={handleSend}
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </div>
  );
}
