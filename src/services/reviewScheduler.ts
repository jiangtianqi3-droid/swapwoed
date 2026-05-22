import type { SwipeAction } from "../models/ReviewLog";
import type { UserWordProgress, WordStatus } from "../models/UserWordProgress";
import { daysFromNow, minutesFromNow } from "../utils/dateUtils";

export const calculateNextReviewDate = (action: SwipeAction, familiarity: number, now = new Date()) => {
  if (action === "left") return minutesFromNow(5, now).toISOString();
  if (action === "up") return minutesFromNow(30, now).toISOString();
  if (action === "down") return daysFromNow(7, now).toISOString();

  if (familiarity <= 1) return daysFromNow(1, now).toISOString();
  if (familiarity === 2) return daysFromNow(3, now).toISOString();
  if (familiarity === 3) return daysFromNow(7, now).toISOString();
  if (familiarity === 4) return daysFromNow(15, now).toISOString();
  return daysFromNow(30, now).toISOString();
};

export const updateWordStatus = (progress: UserWordProgress, action: SwipeAction): WordStatus => {
  if (action === "left") {
    if (progress.status === "mastered" || progress.wrongCount >= 2) return "weak";
    return "learning";
  }

  if (action === "up") {
    return progress.status === "new" ? "learning" : progress.status;
  }

  if (action === "down") {
    return progress.status === "new" ? "review" : progress.status === "weak" ? "review" : progress.status;
  }

  if (progress.familiarity >= 5 && progress.rightCount >= 4) return "mastered";
  if (progress.rightCount >= 2 || progress.familiarity >= 2) return "review";
  return "learning";
};

export const applySwipeToProgress = (
  current: UserWordProgress,
  action: SwipeAction,
  now = new Date(),
): UserWordProgress => {
  const next: UserWordProgress = {
    ...current,
    lastReviewedAt: now.toISOString(),
  };

  if (action === "left") {
    next.familiarity = Math.max(0, next.familiarity - 1);
    next.wrongCount += 1;
    next.recognitionScore = Math.max(0, next.recognitionScore - 12);
  }

  if (action === "up") {
    next.fuzzyCount += 1;
    next.recognitionScore = Math.max(0, next.recognitionScore - 3);
  }

  if (action === "right") {
    next.familiarity += 1;
    next.rightCount += 1;
    next.recognitionScore = Math.min(100, next.recognitionScore + 16);
  }

  if (action === "down") {
    next.familiarity += 2;
    next.rightCount += 1;
    next.recognitionScore = Math.min(100, next.recognitionScore + 24);
  }

  next.nextReviewAt = calculateNextReviewDate(action, next.familiarity, now);
  next.status = updateWordStatus(next, action);
  return next;
};
