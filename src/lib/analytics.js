/**
 * GA4 Analytics helper
 * Measurement ID: G-MNL3G8D1D1
 *
 * Conversion events (mark each as a conversion in GA4 Admin → Events):
 * sign_up_success, profile_publish, job_post_success, bid_submit,
 * workspace_created, message_sent, onboarding_complete
 */

const MEASUREMENT_ID = "G-MNL3G8D1D1";

/** GA4 conversion event names — register in GA4 Admin → Data display → Events → Mark as conversion */
export const GA4_CONVERSION_EVENTS = {
  SIGN_UP_SUCCESS: "sign_up_success",
  PROFILE_PUBLISH: "profile_publish",
  JOB_POST_SUCCESS: "job_post_success",
  BID_SUBMIT: "bid_submit",
  WORKSPACE_CREATED: "workspace_created",
  MESSAGE_SENT: "message_sent",
  ONBOARDING_COMPLETE: "onboarding_complete",
};

const CONVERSION_EVENT_NAMES = new Set(Object.values(GA4_CONVERSION_EVENTS));

function gtag(...args) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/**
 * Fire a GA4 conversion event (custom event name = conversion key in GA4).
 */
export function trackConversion(eventName, params = {}) {
  if (typeof window === "undefined") return;
  if (!CONVERSION_EVENT_NAMES.has(eventName)) {
    console.warn("[analytics] Unknown conversion event:", eventName);
    return;
  }
  gtag("event", eventName, {
    event_category: "conversion",
    is_conversion_event: true,
    device_type: getDeviceType(),
    page_path: window.location.pathname,
    ...params,
  });
}

/** Fire a conversion at most once per browser session for the given dedupe key. */
export function trackConversionOnce(eventName, dedupeKey, params = {}) {
  if (typeof window === "undefined" || !dedupeKey) return;
  const storageKey = `ga4_conv_${dedupeKey}`;
  try {
    if (sessionStorage.getItem(storageKey)) return;
    trackConversion(eventName, params);
    sessionStorage.setItem(storageKey, "1");
  } catch {
    trackConversion(eventName, params);
  }
}

// ── Device helper ─────────────────────────────────────────────
export function getDeviceType() {
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

// ── Page view ─────────────────────────────────────────────────
export function trackPageView(path, title) {
  gtag("event", "page_view", {
    page_location: window.location.origin + path,
    page_path: path,
    page_title: title || document.title,
    device_type: getDeviceType(),
  });
}

// ── CTA clicks ────────────────────────────────────────────────
export function trackCTAClick(label, destination = "") {
  gtag("event", "cta_click", {
    event_category: "engagement",
    cta_label: label,
    destination,
    device_type: getDeviceType(),
  });
}

// ── Trust widget events ───────────────────────────────────────
export function trackTrustWidgetOpen(page) {
  gtag("event", "trust_widget_open", {
    event_category: "trust_game",
    page_path: page,
    device_type: getDeviceType(),
  });
}

export function trackTrustPhaseLocked(phase, pct, page) {
  gtag("event", "trust_phase_locked", {
    event_category: "trust_game",
    phase_index: phase,
    confidence_pct: pct,
    page_path: page,
    device_type: getDeviceType(),
  });
}

export function trackTrustCompleted(avgPct, sentiment, page) {
  gtag("event", "trust_completed", {
    event_category: "trust_game",
    avg_confidence_pct: avgPct,
    sentiment,
    page_path: page,
    device_type: getDeviceType(),
  });
}

// ── Scroll depth ──────────────────────────────────────────────
const SCROLL_MILESTONES = [25, 50, 75, 90];
const firedMilestones = new Set();

function handleScroll() {
  const scrolled = window.scrollY + window.innerHeight;
  const total = document.documentElement.scrollHeight;
  const pct = Math.round((scrolled / total) * 100);

  for (const milestone of SCROLL_MILESTONES) {
    if (pct >= milestone && !firedMilestones.has(milestone)) {
      firedMilestones.add(milestone);
      gtag("event", "scroll_depth", {
        event_category: "engagement",
        scroll_milestone: milestone,
        page_path: window.location.pathname,
        device_type: getDeviceType(),
      });
    }
  }
}

// ── Engagement time ───────────────────────────────────────────
let engagementStart = Date.now();
let engagementSent = false;

function handleVisibilityChange() {
  if (document.visibilityState === "hidden" && !engagementSent) {
    const seconds = Math.round((Date.now() - engagementStart) / 1000);
    gtag("event", "engagement_time", {
      event_category: "engagement",
      seconds_on_page: seconds,
      page_path: window.location.pathname,
      device_type: getDeviceType(),
    });
    engagementSent = true;
  }
  if (document.visibilityState === "visible") {
    engagementStart = Date.now();
    engagementSent = false;
  }
}

// ── Init (call once per page) ─────────────────────────────────
let scrollListenerAdded = false;

export function initPageTracking(path, title) {
  // Reset scroll milestones on new page
  firedMilestones.clear();
  engagementStart = Date.now();
  engagementSent = false;

  trackPageView(path, title);

  if (!scrollListenerAdded) {
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scrollListenerAdded = true;
  }
}