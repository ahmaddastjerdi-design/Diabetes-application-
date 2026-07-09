// English is the source-of-truth locale; its shape defines the Dict type.
export const en = {
  app: {
    name: 'HealthPassport Pro',
    tagline: 'Your health record, in your pocket.',
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    loading: 'Loading…',
    none: 'None recorded',
    required: 'Required',
    today: 'Today',
    skipToContent: 'Skip to content',
  },
  nav: {
    home: 'Home',
    record: 'Record',
    care: 'Care',
    learn: 'Learn',
    report: 'Report',
  },
  disclaimer: {
    short: 'Educational personal health record — not medical advice or a diagnosis.',
    banner:
      'HealthPassport Pro helps you organize your health information. It does not diagnose, prescribe, or replace your care team.',
  },
  safety: {
    emergencyTitle: 'This may need emergency care',
    emergencyBody:
      'Some of what you entered can be serious. If you feel unwell, contact emergency services now.',
    urgentTitle: 'Contact your care team promptly',
    urgentBody:
      'This is outside the usual range. Reach out to your clinician soon to discuss it.',
    acknowledge: 'I understand',
    referenceNote:
      'Ranges are general guidance, not a diagnosis. Discuss any concerns with your care team.',
  },
  onboarding: {
    welcomeTitle: 'Welcome to HealthPassport Pro',
    welcomeBody:
      'Keep your personal health record with you — private, offline, and ready to share with your clinician.',
    privacyTitle: 'Private by design',
    privacyBody:
      'Your data is encrypted on this device with a passphrase only you know. It never leaves your device unless you choose to export it.',
    safetyTitle: 'An assistant, not a doctor',
    safetyBody:
      'This app organizes your information and offers general education. It never diagnoses or changes your treatment. In an emergency, contact your local emergency number.',
    acknowledge: 'I understand and agree',
    getStarted: 'Get started',
  },
  home: {
    greeting: 'Hello',
    greetingNamed: 'Hello, {name}',
    todayOverview: "Today's overview",
    quickAdd: 'Quick add',
    nothingYet: 'Start by adding your first reading or condition.',
  },
  theme: {
    toggle: 'Toggle theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  language: {
    label: 'Language',
  },
} as const;
