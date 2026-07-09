/** Format a Date (or null) as a short readable date. */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
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
