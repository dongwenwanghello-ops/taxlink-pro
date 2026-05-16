// Calculate time remaining until deadline
export function getTimeRemaining(deadline) {
  if (!deadline) return null;
  
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  
  if (diff <= 0) {
    return { expired: true, text: "Bidding closed", days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  let text = "";
  if (days > 0) {
    text = `${days} day${days > 1 ? "s" : ""} left`;
  } else if (hours > 0) {
    text = `${hours} hour${hours > 1 ? "s" : ""} left`;
  } else {
    text = `${minutes} minute${minutes > 1 ? "s" : ""} left`;
  }
  
  return { expired: false, text, days, hours, minutes };
}

// Get urgency level based on time remaining
export function getUrgencyLevel(deadline) {
  const time = getTimeRemaining(deadline);
  if (!time || time.expired) return "expired";
  
  const totalMinutes = time.days * 24 * 60 + time.hours * 60 + time.minutes;
  
  if (totalMinutes <= 60) return "critical"; // Last hour
  if (totalMinutes <= 24 * 60) return "high"; // Last day
  if (totalMinutes <= 3 * 24 * 60) return "medium"; // Last 3 days
  return "normal";
}

// Format deadline for display
export function formatDeadline(deadline) {
  if (!deadline) return null;
  
  const date = new Date(deadline);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) return `Today at ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (isTomorrow) return `Tomorrow at ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}