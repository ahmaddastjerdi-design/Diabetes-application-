/** theme.ts — shared design tokens for a calm, encouraging clinical-friendly UI. */
export const theme = {
  colors: {
    bg: "#f5f8fc",
    card: "#ffffff",
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    text: "#0f172a",
    subtext: "#64748b",
    border: "#e2e8f0",
    good: "#16a34a",
    warn: "#d97706",
    bad: "#dc2626",
    heart: "#ef4444",
    kidney: "#8b5cf6",
    xp: "#f59e0b",
  },
  radius: { sm: 8, md: 14, lg: 20, pill: 999 },
  space: (n: number) => n * 4,
  shadow: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
