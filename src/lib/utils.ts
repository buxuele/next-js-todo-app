export function formatDate(dt: string | Date | null): string {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";

  // Format time as HH:MM
  return d.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateForDisplay(dateStr: string): string {
  // Avoid timezone issues by parsing date string directly
  const [year, month, day] = dateStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Always display specific month and day, not relative time
  return date.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });
}

export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function validateDateFormat(dateStr: string): boolean {
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr + "T00:00:00");
    return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
  } catch {
    return false;
  }
}

export function sanitizeContent(content: string): string {
  return content.trim().replace(/<script|javascript:|on\w+\s*=/gi, "");
}
