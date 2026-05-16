/**
 * GA4 Analytics helper
 * Measurement ID: G-MNL3G8D1D1
 */

const MEASUREMENT_ID = "G-MNL3G8D1D1";

function gtag(...args) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
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