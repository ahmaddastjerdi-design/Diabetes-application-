/**
 * lessons.ts — short, gamified education "quests".
 *
 * Each lesson is a few bite-size cards followed by a single check-question.
 * Content is intentionally general patient education (type 2 diabetes focus)
 * and must be reviewed by a clinician before any real-world release.
 */

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  explain: string;
}

export interface LessonCard {
  title: string;
  body: string;
}

export interface LessonDef {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  cards: LessonCard[];
  quiz: QuizQuestion;
}

export const LESSONS: LessonDef[] = [
  {
    id: "glucose-101",
    title: "What is blood glucose?",
    emoji: "🩸",
    summary: "Why sugar in your blood matters and what 'in range' means.",
    cards: [
      {
        title: "Sugar is fuel",
        body: "Glucose is the sugar your cells use for energy. Insulin is the key that lets glucose move from your blood into your cells.",
      },
      {
        title: "In type 2 diabetes",
        body: "The key works less well, so glucose builds up in the blood. A common target before meals is roughly 80–130 mg/dL.",
      },
      {
        title: "Why it matters",
        body: "Persistently high glucose slowly damages the tiny blood vessels in your kidneys, eyes, and heart.",
      },
    ],
    quiz: {
      prompt: "What does insulin do?",
      options: [
        "Raises blood pressure",
        "Lets glucose move from blood into cells",
        "Filters waste from blood",
      ],
      answerIndex: 1,
      explain: "Insulin is the 'key' that moves glucose out of the blood into cells for energy.",
    },
  },
  {
    id: "kidney-link",
    title: "How diabetes affects kidneys",
    emoji: "🫘",
    summary: "Your kidneys are filters — and high sugar clogs them.",
    cards: [
      {
        title: "Millions of tiny filters",
        body: "Each kidney holds about a million filtering units. They clean your blood and balance water and salt.",
      },
      {
        title: "Sugar + pressure damage filters",
        body: "High glucose and high blood pressure scar these filters over years, a process called diabetic kidney disease.",
      },
      {
        title: "What protects them",
        body: "Keeping glucose and blood pressure in range, staying hydrated, and not skipping medicine all protect kidney function.",
      },
    ],
    quiz: {
      prompt: "Which two things most damage kidney filters over time?",
      options: [
        "High glucose and high blood pressure",
        "Drinking water and walking",
        "Sleeping and resting",
      ],
      answerIndex: 0,
      explain: "Sustained high glucose and high blood pressure are the main drivers of kidney damage in diabetes.",
    },
  },
  {
    id: "heart-link",
    title: "Protecting your heart",
    emoji: "❤️",
    summary: "Blood pressure, cholesterol and sugar all reach the heart.",
    cards: [
      {
        title: "A shared blood supply",
        body: "Your heart pumps blood through vessels that diabetes can stiffen and narrow, raising the risk of heart attack and stroke.",
      },
      {
        title: "The big three",
        body: "Blood pressure, LDL ('bad') cholesterol, and blood glucose are the three levers that most affect heart risk.",
      },
      {
        title: "Movement is medicine",
        body: "Regular activity lowers all three at once — even a daily 30-minute walk makes a measurable difference.",
      },
    ],
    quiz: {
      prompt: "Which single habit lowers glucose, blood pressure AND cholesterol?",
      options: ["Skipping meals", "Regular physical activity", "Adding salt"],
      answerIndex: 1,
      explain: "Regular exercise improves all three risk markers together.",
    },
  },
  {
    id: "meds-matter",
    title: "Why taking medicine on time matters",
    emoji: "💊",
    summary: "Adherence keeps your markers steady instead of bouncing.",
    cards: [
      {
        title: "Medicines hold the line",
        body: "Drugs like metformin, blood-pressure pills and statins each target one marker and work best taken consistently.",
      },
      {
        title: "Missing doses rebounds",
        body: "Skip a dose and the marker it controls rebounds, undoing days of good choices.",
      },
      {
        title: "Build a routine",
        body: "Pair medicine with a daily habit (e.g. brushing teeth) and use reminders so it becomes automatic.",
      },
    ],
    quiz: {
      prompt: "What happens when you skip your medicine?",
      options: [
        "Nothing, it averages out",
        "The marker it controls rebounds upward",
        "Your streak increases",
      ],
      answerIndex: 1,
      explain: "Each medicine controls a marker; missing it lets that marker climb back up.",
    },
  },
];

export function getLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}
