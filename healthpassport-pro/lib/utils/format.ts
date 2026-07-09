/** Format a Date (or null) as a short readable date. */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** Compact date+time, e.g. "Jul 9, 3:20 PM". */
export function formatDateTime(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/** Short chart-axis label, e.g. "7/9". */
export function shortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const TITLE_CASE: Record<string, string> = {
  ACTIVE: 'Active',
  RESOLVED: 'Resolved',
  REMISSION: 'In remission',
  INACTIVE: 'Inactive',
  STOPPED: 'Stopped',
  COMPLETED: 'Completed',
  HIGH: 'High',
  LOW: 'Low',
  UNABLE_TO_ASSESS: 'Severity unknown',
  OFFICE: 'Office visit',
  TELEHEALTH: 'Telehealth',
  LAB: 'Lab',
  HOSPITAL: 'Hospital',
  OTHER: 'Other',
};

export function humanizeEnum(value: string): string {
  return TITLE_CASE[value] ?? value;
}
