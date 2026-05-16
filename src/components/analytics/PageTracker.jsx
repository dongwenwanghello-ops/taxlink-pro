import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initPageTracking } from "@/lib/analytics";

const PAGE_TITLES = {
  "/": "Home",
  "/professionals": "Find Professionals",
  "/jobs": "Job Board",
  "/create-profile": "Create Profile",
  "/post-job": "Post a Job",
  "/reviews": "Reviews",
  "/admin/feedback": "Admin — Feedback",
  "/admin-feedback": "Admin — Feedback",
};

export default function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] || document.title;
    initPageTracking(location.pathname, `TaxPro UK — ${title}`);
  }, [location.pathname]);

  return null;
}