import {
  Activity,
  BookOpen,
  CalendarClock,
  ClipboardList,
  FileText,
  FlaskConical,
  Folder,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ShieldAlert,
  Settings,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Full grouped navigation (desktop sidebar). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Records',
    items: [
      { href: '/records/conditions', label: 'Conditions', icon: ClipboardList },
      { href: '/records/medications', label: 'Medications', icon: Pill },
      { href: '/records/allergies', label: 'Allergies', icon: TriangleAlert },
      { href: '/records/documents', label: 'Documents', icon: Folder },
      { href: '/records/encounters', label: 'Encounters', icon: Stethoscope },
    ],
  },
  {
    label: 'Track',
    items: [
      { href: '/track/vitals', label: 'Vitals', icon: Activity },
      { href: '/track/labs', label: 'Labs', icon: FlaskConical },
      { href: '/track/symptoms', label: 'Symptoms', icon: HeartPulse },
      { href: '/track/daily-checkin', label: 'Daily check-in', icon: CalendarClock },
    ],
  },
  {
    label: 'Guidance',
    items: [
      { href: '/guide', label: 'Chronic-care guide', icon: BookOpen },
      { href: '/reports', label: 'Doctor report', icon: FileText },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/privacy-security', label: 'Privacy & security', icon: ShieldAlert },
    ],
  },
];

/** Primary destinations for the mobile bottom nav. */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/records/conditions', label: 'Records', icon: Folder },
  { href: '/track/vitals', label: 'Track', icon: Gauge },
  { href: '/guide', label: 'Guide', icon: BookOpen },
  { href: '/reports', label: 'Report', icon: FileText },
];
