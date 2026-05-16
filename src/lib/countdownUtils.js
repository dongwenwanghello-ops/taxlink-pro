const MS_SECOND = 1000;
const MS_MINUTE = 60 * MS_SECOND;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;

const BIDDING_PERIOD_MS = {
  "24h": MS_DAY,
  "3d": 3 * MS_DAY,
  "5d": 5 * MS_DAY,
  "7d": 7 * MS_DAY,
  "10d": 10 * MS_DAY,
};

/** Resolve deadline from job object or raw ISO string */
export function resolveDeadline(source) {
  if (!source) return null;
  if (typeof source === "string") return source;
  return source.bidding_deadline || source.deadline || null;
}

/** Parse deadline into milliseconds remaining (negative if expired) */
export function getMsRemaining(deadline) {
  if (!deadline) return null;
  return new Date(deadline).getTime() - Date.now();
}

/** Break remaining time into units */
export function getTimeParts(ms) {
  const abs = Math.max(0, ms);
  return {
    days: Math.floor(abs / MS_DAY),
    hours: Math.floor((abs % MS_DAY) / MS_HOUR),
    minutes: Math.floor((abs % MS_HOUR) / MS_MINUTE),
    seconds: Math.floor((abs % MS_MINUTE) / MS_SECOND),
    totalMs: abs,
  };
}

export function getTimeRemaining(deadline) {
  const ms = getMsRemaining(deadline);
  if (ms === null) return null;

  if (ms <= 0) {
    return {
      expired: true,
      ms: 0,
      ...getTimeParts(0),
      label: "Bidding Closed",
      shortLabel: "Closed",
    };
  }

  const parts = getTimeParts(ms);
  const totalHours = parts.totalMs / MS_HOUR;

  let label;
  if (totalHours > 48) {
    const segments = [];
    if (parts.days > 0) segments.push(`${parts.days}d`);
    if (parts.hours > 0) segments.push(`${parts.hours}h`);
    label = `Bidding closes in ${segments.join(" ") || "< 1h"}`;
  } else if (totalHours > 6) {
    const h = Math.floor(totalHours);
    const m = parts.minutes;
    label = m > 0 ? `${h}h ${m}m left to submit quote` : `${h}h left to submit quote`;
  } else if (totalHours > 1) {
    label = "Ending soon";
  } else {
    const m = Math.floor(parts.totalMs / MS_MINUTE);
    label = m > 0 ? `Ending soon · ${m}m left` : `Ending soon · ${parts.seconds}s left`;
  }

  return {
    expired: false,
    ms,
    ...parts,
    label,
    shortLabel: formatCompact(parts),
  };
}

function formatCompact({ days, hours, minutes }) {
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

/**
 * Urgency: green (>48h), orange (<24h), red (<6h), expired (grey)
 */
export function getUrgencyLevel(deadline) {
  const ms = getMsRemaining(deadline);
  if (ms === null) return null;
  if (ms <= 0) return "expired";

  const hours = ms / MS_HOUR;
  if (hours < 6) return "critical";
  if (hours < 24) return "urgent";
  return "comfortable";
}

function parseDurationMs(period) {
  if (!period) return null;
  if (typeof period === "number" && Number.isFinite(period)) return period * MS_DAY;
  if (BIDDING_PERIOD_MS[period]) return BIDDING_PERIOD_MS[period];

  const match = String(period).trim().match(/^(\d+(?:\.\d+)?)(h|d)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return match[2].toLowerCase() === "h" ? amount * MS_HOUR : amount * MS_DAY;
}

/** Progress through bidding window (0-1 elapsed) from posted time or configured period. */
export function getBiddingProgress(deadline, startDate, biddingPeriod) {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (!Number.isFinite(end)) return null;

  const explicitStart = startDate ? new Date(startDate).getTime() : null;
  const durationMs = parseDurationMs(biddingPeriod);
  const start = Number.isFinite(explicitStart) ? explicitStart : durationMs ? end - durationMs : null;
  if (!Number.isFinite(start)) return null;

  const span = end - start;
  if (span <= 0) return null;

  const elapsed = Date.now() - start;
  return Math.min(1, Math.max(0, elapsed / span));
}

/** Tick interval: 1s when urgent, 30s when comfortable */
export function getCountdownTickMs(deadline) {
  const ms = getMsRemaining(deadline);
  if (ms === null) return 30000;
  if (ms <= 0) return 60000;
  if (ms < 6 * MS_HOUR) return 1000;
  if (ms < 24 * MS_HOUR) return 5000;
  return 30000;
}

export function isBiddingClosed(deadline) {
  const ms = getMsRemaining(deadline);
  return ms !== null && ms <= 0;
}

export function formatDeadline(deadline) {
  if (!deadline) return null;

  const date = new Date(deadline);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Today at ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}
