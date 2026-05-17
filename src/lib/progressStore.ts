const KEY = 'resous_completed_problems';

export interface CompletedProblem {
  id: string;
  problemId: string;
  date: string;
  level: string;
  theme: string;
  title: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  hintsUsed: number;
  score: number;
  stepScores: {
    reading: boolean;
    questionIdentified: boolean;
    dataIdentified: boolean;
    planning: boolean;
    calculations: boolean;
    finalAnswer: boolean;
  };
  needsPractice: string[];
}

export function loadProgress(): CompletedProblem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProgress(problems: CompletedProblem[]): void {
  localStorage.setItem(KEY, JSON.stringify(problems));
}

export function addCompletedProblem(p: CompletedProblem): void {
  const existing = loadProgress();
  saveProgress([...existing, p]);
}
