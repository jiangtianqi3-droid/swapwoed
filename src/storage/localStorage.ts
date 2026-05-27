import { defaultSettings, type AppSettings } from "../models/Settings";
import type { ReviewLog } from "../models/ReviewLog";
import type { UserWordProgress } from "../models/UserWordProgress";
import { words } from "../data/words";
import { validateBookId } from "../services/wordBookService";

const keys = {
  progress: "swipeword.progress.v1",
  logs: "swipeword.reviewLogs.v1",
  settings: "swipeword.settings.v1",
  lastSummary: "swipeword.lastSummary.v1",
};

export type StudySummary = {
  studiedCount: number;
  right: number;
  wrong: number;
  fuzzy: number;
  easy: number;
  newWeakCount: number;
  nextReviewAt?: string;
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const createDefaultProgress = (wordId: string): UserWordProgress => ({
  wordId,
  status: "new",
  familiarity: 0,
  rightCount: 0,
  wrongCount: 0,
  fuzzyCount: 0,
  isFavorite: false,
  recognitionScore: 0,
  spellingScore: 0,
});

export const loadProgressMap = () => {
  const saved = safeParse<Record<string, UserWordProgress>>(localStorage.getItem(keys.progress), {});
  const merged: Record<string, UserWordProgress> = { ...saved };
  words.forEach((word) => {
    if (!merged[word.id]) merged[word.id] = createDefaultProgress(word.id);
  });
  return merged;
};

export const saveProgressMap = (progress: Record<string, UserWordProgress>) => {
  localStorage.setItem(keys.progress, JSON.stringify(progress));
};

export const loadReviewLogs = () => safeParse<ReviewLog[]>(localStorage.getItem(keys.logs), []);

export const saveReviewLogs = (logs: ReviewLog[]) => {
  localStorage.setItem(keys.logs, JSON.stringify(logs));
};

export const loadSettings = (): AppSettings => {
  const saved = safeParse<Partial<AppSettings>>(localStorage.getItem(keys.settings), {});
  const wordOrder = saved.wordOrder ?? (saved.shuffleLearning ? "random" : defaultSettings.wordOrder);
  return {
    ...defaultSettings,
    ...saved,
    selectedBookId: validateBookId(saved.selectedBookId),
    wordOrder,
    shuffleLearning: wordOrder === "random",
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(keys.settings, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("swipeword:settings-changed", { detail: settings }));
};

export const loadLastSummary = () => safeParse<StudySummary | null>(localStorage.getItem(keys.lastSummary), null);

export const saveLastSummary = (summary: StudySummary) => {
  localStorage.setItem(keys.lastSummary, JSON.stringify(summary));
};

export const clearLearningRecords = () => {
  localStorage.removeItem(keys.progress);
  localStorage.removeItem(keys.logs);
  localStorage.removeItem(keys.lastSummary);
};
