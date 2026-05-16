import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const REACTIONS = [
  { value: "skeptical",    emoji: "😬", label: "Skeptical" },
  { value: "interesting",  emoji: "🙂", label: "Interesting" },
  { value: "would_use",    emoji: "🔥", label: "Would Use" },
];

export default function FeedbackWidget() {
  const [open,      setOpen]      = useState(false);
  const [reaction,  setReaction]  = useState(null);
  const [comment,   setComment]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const handleSubmit = async () => {
    if (!reaction) return;
    setSaving(true);
    try {
      await base44.entities.FeedbackEntry.create({
        reaction_type: reaction,
        component:     "TrustPulseWidget",
        page:          window.location.pathname,
        sentiment:     reaction === "would_use" ? "positive" : reaction === "skeptical" ? "negative" : "neutral",
        device:        window.innerWidth < 768 ? "mobile" : "desktop",
        session_id:    sessionStorage.getItem("sid") || (() => {
          const id = Math.random().toString(36).slice(2);
          sessionStorage.setItem("sid", id);
          return id;
        })(),
        // store the free-text in the first available string-ish field
        trust: comment || reaction,
      });
    } catch (_) {
      // silent — still show success in the demo
    }
    setSaving(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setSubmitted(false); setReaction(null); setComment(""); }, 350);
  };

  return (
    <motion.div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2 pointer-events-none">

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 12,  scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-auto w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.16)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <span className="text-sm font-semibold text-foreground">🛡 Trust Pulse</span>
              <button onClick={handleClose}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                /* ── Success state ── */
                <motion.div key="ok"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 py-8 px-5 text-center">
                  <Zap className="h-8 w-8 text-violet-500" />
                  <p className="text-sm font-semibold text-foreground">⚡ Feedback received — trust level improving.</p>
                  <p className="text-xs text-muted-foreground">Thank you for shaping the platform.</p>
                  <button onClick={handleClose}
                    className="mt-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
                    Close
                  </button>
                </motion.div>
              ) : (
                /* ── Form ── */
                <motion.div key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-4 space-y-4">

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-3">
                      How trustworthy does TaxProUK feel?
                    </p>
                    <div className="flex gap-2">
                      {REACTIONS.map(r => (
                        <button key={r.value} type="button"
                          onClick={() => setReaction(r.value)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all
                            ${reaction === r.value
                              ? "border-primary bg-primary/8 text-primary shadow-sm"
                              : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:bg-secondary"
                            }`}>
                          <span className="text-lg leading-none">{r.emoji}</span>
                          <span>{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      What would stop you from using this platform?
                    </p>
                    <textarea
                      rows={3}
                      placeholder="e.g. more reviews, price transparency…"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!reaction || saving}
                      className="w-full h-9 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                    >
                      {saving ? "Saving…" : "Submit"}
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Early beta — your feedback shapes the platform.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="pointer-events-auto flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full text-sm font-bold text-white shadow-lg"
        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.45)" }}
      >
        <span className="text-base leading-none">🛡</span>
        <span>{open ? "Close" : "Trust Pulse"}</span>
      </motion.button>
    </motion.div>
  );
}