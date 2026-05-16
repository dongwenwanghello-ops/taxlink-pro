import { getMsRemaining, resolveDeadline } from "@/lib/countdownUtils";

export function getBiddingState(project) {
  const deadline = resolveDeadline(project);
  const msRemaining = getMsRemaining(deadline);
  const hasValidDeadline = msRemaining !== null && Number.isFinite(msRemaining);
  const deadlineExpired = hasValidDeadline && msRemaining <= 0;
  const status = project?.status || "open";
  const acceptingBids = project?.accepting_bids !== false && project?.openForBids !== false;
  const isOpen = (status === "open" || status === "reviewing") && acceptingBids && hasValidDeadline && !deadlineExpired;

  return {
    status,
    deadline,
    hasDeadline: hasValidDeadline,
    deadlineExpired,
    acceptingBids,
    isOpen,
    isClosed: !isOpen,
    closedReason: getClosedReason({ status, acceptingBids, hasValidDeadline, deadlineExpired }),
  };
}

function getClosedReason({ status, acceptingBids, hasValidDeadline, deadlineExpired }) {
  if (status !== "open") return status;
  if (!acceptingBids) return "not_accepting_bids";
  if (!hasValidDeadline) return "missing_deadline";
  if (deadlineExpired) return "deadline_expired";
  return null;
}
