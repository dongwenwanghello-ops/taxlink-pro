const KEY = "taxprouk_posted_projects";

export function getPostedProjects() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProject(project) {
  const existing = getPostedProjects();
  const updated = [project, ...existing];
  localStorage.setItem(KEY, JSON.stringify(updated));
  // Dispatch custom event so Jobs page can react without a refresh
  window.dispatchEvent(new CustomEvent("projectPosted", { detail: project }));
}