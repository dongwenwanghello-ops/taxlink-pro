const KEY = "taxprouk_posted_projects";

const CATEGORY_ALIASES = {
  self_assessment: "tax_return",
  vat_return: "vat",
  rd_claim: "corporation_tax",
  tax_investigation: "advisory",
  capital_gains: "advisory",
  inheritance_tax: "advisory",
};

function defaultBiddingDeadline() {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  return deadline.toISOString();
}

export function normalizeProject(project = {}) {
  const services = Array.isArray(project.services) ? project.services : [];
  const rawCategory = project.category || services[0] || "other";
  const status = project.status || "open";
  const urgencyAliases = {
    flexible: "negotiable",
    within_month: "standard",
    within_2weeks: "standard",
    within_week: "urgent",
  };
  const urgency = urgencyAliases[project.urgency] || project.urgency || "negotiable";
  const acceptingBids = status === "open" || status === "reviewing"
    ? project.accepting_bids ?? project.openForBids ?? true
    : false;
  const missingRecords = project.missing_records ?? project.missingRecords ?? false;
  const multipleIncomeSources = project.multiple_income_sources ?? project.multipleIncomeSources ?? false;
  const internationalTaxIssues = project.international_tax_issues ?? project.internationalTaxIssues ?? false;
  const estimatedWorkload = project.estimated_workload ?? project.estimatedWorkload ?? null;
  const deadlinePressure = project.deadline_pressure ?? project.deadlinePressure ?? null;
  const budgetAmount = project.budget_amount ?? project.opening_budget_amount ?? project.starting_bid ?? null;

  return {
    ...project,
    services,
    category: CATEGORY_ALIASES[rawCategory] || rawCategory,
    status,
    urgency,
    accepting_bids: acceptingBids,
    openForBids: acceptingBids,
    bidding_deadline: project.bidding_deadline || project.deadline || defaultBiddingDeadline(),
    missing_records: missingRecords,
    missingRecords,
    multiple_income_sources: multipleIncomeSources,
    multipleIncomeSources,
    international_tax_issues: internationalTaxIssues,
    internationalTaxIssues,
    estimated_workload: estimatedWorkload,
    estimatedWorkload,
    deadline_pressure: deadlinePressure,
    deadlinePressure,
    budget_amount: budgetAmount,
    starting_bid: project.starting_bid ?? budgetAmount,
    remote: project.remote ?? true,
    duration: project.duration || "one_off",
    budget_type: project.budget_type || "fixed",
  };
}

export function getPostedProjects() {
  try {
    const projects = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(projects) ? projects.map(normalizeProject) : [];
  } catch {
    return [];
  }
}

export function saveProject(project) {
  const savedProject = normalizeProject({
    id: project.id || `posted-${Date.now()}`,
    created_date: project.created_date || new Date().toISOString(),
    _user_posted: true,
    ...project,
  });
  const existing = getPostedProjects();
  const updated = [
    savedProject,
    ...existing.filter((item) => item.id !== savedProject.id),
  ];
  localStorage.setItem(KEY, JSON.stringify(updated));
  // Dispatch custom event so Jobs page can react without a refresh
  window.dispatchEvent(new CustomEvent("projectPosted", { detail: savedProject }));
  return savedProject;
}

export function updateProject(projectId, patch) {
  const existing = getPostedProjects();
  let updatedProject = null;
  const updated = existing.map((project) => {
    if (project.id !== projectId) return project;
    updatedProject = normalizeProject({
      ...project,
      ...patch,
      updated_date: new Date().toISOString(),
    });
    return updatedProject;
  });

  if (!updatedProject) return null;

  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("projectUpdated", { detail: updatedProject }));
  window.dispatchEvent(new CustomEvent("projectPosted", { detail: updatedProject }));
  return updatedProject;
}

export function awardProject(projectId, bid) {
  return updateProject(projectId, {
    status: "in_progress",
    lifecycle_state: "awarded",
    awarded_bid_id: bid?.id,
    awarded_bidder_name: bid?.bidder_name,
    awarded_amount: bid?.amount,
    awarded_at: new Date().toISOString(),
    accepting_bids: false,
    openForBids: false,
  });
}

export function mergeProjectSources(...sources) {
  const seen = new Set();

  return sources
    .flat()
    .filter(Boolean)
    .map(normalizeProject)
    .filter((project) => {
      if (!project.id || seen.has(project.id)) return false;
      seen.add(project.id);
      return true;
    });
}
