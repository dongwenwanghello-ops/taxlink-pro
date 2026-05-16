import { useState, useEffect, useMemo } from "react";
import {
  resolveDeadline,
  getTimeRemaining,
  getUrgencyLevel,
  getBiddingProgress,
  getCountdownTickMs,
} from "@/lib/countdownUtils";
import { getBiddingState } from "@/lib/biddingState";

/**
 * Live bidding countdown state for a project deadline.
 * Accepts an ISO string, or a job-like object with bidding_deadline / deadline.
 */
export function useBiddingCountdown(source, { startDate, biddingPeriod } = {}) {
  const deadline = useMemo(() => resolveDeadline(source), [
    typeof source === "string" ? source : source?.bidding_deadline ?? source?.deadline,
  ]);
  const resolvedStartDate = startDate ?? (typeof source === "string" ? undefined : source?.created_date ?? source?.created_at);
  const resolvedBiddingPeriod = biddingPeriod ?? (typeof source === "string" ? undefined : source?.bidding_period);
  const status = typeof source === "string" ? undefined : source?.status;
  const acceptingBids = typeof source === "string" ? undefined : source?.accepting_bids;
  const openForBids = typeof source === "string" ? undefined : source?.openForBids;

  const [snapshot, setSnapshot] = useState(() => buildSnapshot(source, deadline, resolvedStartDate, resolvedBiddingPeriod));

  useEffect(() => {
    if (!deadline) {
      setSnapshot(buildSnapshot(source, null, resolvedStartDate, resolvedBiddingPeriod));
      return undefined;
    }

    const tick = () => setSnapshot(buildSnapshot(source, deadline, resolvedStartDate, resolvedBiddingPeriod));
    tick();

    let intervalId = setInterval(tick, getCountdownTickMs(deadline));

    const watchdog = setInterval(() => {
      const nextMs = getCountdownTickMs(deadline);
      clearInterval(intervalId);
      intervalId = setInterval(tick, nextMs);
    }, 15000);

    return () => {
      clearInterval(intervalId);
      clearInterval(watchdog);
    };
  }, [deadline, resolvedStartDate, resolvedBiddingPeriod, status, acceptingBids, openForBids]);

  return {
    deadline,
    hasDeadline: Boolean(deadline),
    ...snapshot,
  };
}

function buildSnapshot(source, deadline, startDate, biddingPeriod) {
  if (!deadline) {
    return {
      timeRemaining: null,
      urgency: null,
      progress: null,
      isClosed: true,
      isOpen: false,
      closedReason: "missing_deadline",
      label: null,
      shortLabel: null,
    };
  }

  const biddingState = typeof source === "string"
    ? null
    : getBiddingState(source);
  const timeRemaining = getTimeRemaining(deadline);
  const urgency = getUrgencyLevel(deadline);
  const progress = getBiddingProgress(deadline, startDate, biddingPeriod);
  const isClosed = biddingState ? biddingState.isClosed : timeRemaining?.expired;

  return {
    timeRemaining,
    urgency,
    progress,
    isClosed,
    isOpen: !isClosed,
    closedReason: biddingState?.closedReason ?? (timeRemaining?.expired ? "deadline_expired" : null),
    label: timeRemaining?.label ?? null,
    shortLabel: timeRemaining?.shortLabel ?? null,
  };
}
