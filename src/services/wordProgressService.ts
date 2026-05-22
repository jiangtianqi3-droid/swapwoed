import { defaultWordBooks } from "../data/defaultWordBooks";
import { wordById, words } from "../data/words";
import type { SwipeAction } from "../models/ReviewLog";
import type { AppSettings } from "../models/Settings";
import type { UserWordProgress } from "../models/UserWordProgress";
import {
  loadProgressMap,
  loadReviewLogs,
  loadSettings,
  saveProgressMap,
  saveReviewLogs,
} from "../storage/localStorage";
import { isDue } from "../utils/dateUtils";
import { applySwipeToProgress } from "./reviewScheduler";

export type SwipeResult = {
  wordId: string;
  previousProgress: UserWordProgress;
  nextProgress: UserWordProgress;
  logId: string;
};

export type StudyMode = "today" | "new" | "review" | "weak";

const selectedBookWordIds = (settings: AppSettings) => {
  const book = defaultWordBooks.find((item) => item.id === settings.selectedBookId) ?? defaultWordBooks[0];
  return book.wordIds.length > 0 ? book.wordIds : words.map((word) => word.id);
};

export const getTodayStudyQueue = (mode: StudyMode = "today") => {
  const settings = loadSettings();
  const progressMap = loadProgressMap();
  const bookIds = selectedBookWordIds(settings);
  const now = new Date();

  const dueReview = bookIds.filter((id) => {
    const progress = progressMap[id];
    return progress.status !== "new" && progress.status !== "mastered" && isDue(progress.nextReviewAt, now);
  });

  const newWords = bookIds.filter((id) => progressMap[id].status === "new").slice(0, settings.dailyNewCount);
  const weakWords = bookIds.filter((id) => {
    const progress = progressMap[id];
    return progress.status === "weak" || progress.wrongCount >= 2;
  });

  const queueIds =
    mode === "new"
      ? newWords
      : mode === "review"
        ? dueReview
        : mode === "weak"
          ? weakWords
          : [...dueReview, ...newWords];

  return Array.from(new Set(queueIds))
    .map((id) => wordById.get(id))
    .filter((word): word is NonNullable<typeof word> => Boolean(word));
};

export const handleSwipe = (wordId: string, action: SwipeAction): SwipeResult => {
  const progressMap = loadProgressMap();
  const logs = loadReviewLogs();
  const previousProgress = { ...progressMap[wordId] };
  const nextProgress = applySwipeToProgress(previousProgress, action);
  const logId = crypto.randomUUID();

  progressMap[wordId] = nextProgress;
  logs.push({
    id: logId,
    wordId,
    action,
    reviewedAt: nextProgress.lastReviewedAt ?? new Date().toISOString(),
  });

  saveProgressMap(progressMap);
  saveReviewLogs(logs);
  return { wordId, previousProgress, nextProgress, logId };
};

export const undoSwipe = (result: SwipeResult) => {
  const progressMap = loadProgressMap();
  const logs = loadReviewLogs().filter((log) => log.id !== result.logId);
  progressMap[result.wordId] = result.previousProgress;
  saveProgressMap(progressMap);
  saveReviewLogs(logs);
};

export const toggleFavorite = (wordId: string) => {
  const progressMap = loadProgressMap();
  progressMap[wordId] = {
    ...progressMap[wordId],
    isFavorite: !progressMap[wordId].isFavorite,
  };
  saveProgressMap(progressMap);
  return progressMap[wordId].isFavorite;
};

export const getWeakWords = () => {
  const progressMap = loadProgressMap();
  return words
    .filter((word) => progressMap[word.id].status === "weak" || progressMap[word.id].wrongCount >= 2)
    .sort((a, b) => progressMap[b.id].wrongCount - progressMap[a.id].wrongCount);
};
