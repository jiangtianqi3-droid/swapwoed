import type { StudySession } from "../models/StudySession";
import { loadProgressMap, loadSettings } from "../storage/localStorage";
import { buildStudyQueueIds, type StudyMode } from "./wordProgressService";

let activeSession: StudySession | null = null;

const localDateKey = () => new Date().toLocaleDateString("en-CA");

const createSessionId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createStudySession = (mode: StudyMode = "today"): StudySession => {
  const settings = loadSettings();
  const progressMap = loadProgressMap();
  const queueWordIds = buildStudyQueueIds(mode, settings, progressMap);
  activeSession = {
    sessionId: createSessionId(),
    mode,
    bookId: settings.selectedBookId,
    wordOrder: settings.wordOrder,
    queueWordIds,
    currentIndex: 0,
    createdAt: Date.now(),
    createdDate: localDateKey(),
    settingsSnapshot: {
      selectedBookId: settings.selectedBookId,
      wordOrder: settings.wordOrder,
      dailyNewCount: settings.dailyNewCount,
      dailyReviewLimit: settings.dailyReviewLimit,
    },
  };
  return activeSession;
};

export const getOrCreateStudySession = (mode: StudyMode = "today") => {
  if (activeSession && activeSession.mode === mode) return activeSession;
  return createStudySession(mode);
};

export const getActiveStudySession = () => activeSession;

export const setStudySessionIndex = (currentIndex: number) => {
  if (!activeSession) return;
  activeSession = { ...activeSession, currentIndex };
};

export const setStudySessionQueue = (queueWordIds: string[], currentIndex?: number) => {
  if (!activeSession) return;
  activeSession = {
    ...activeSession,
    queueWordIds,
    currentIndex: currentIndex ?? activeSession.currentIndex,
  };
};

export const clearStudySession = () => {
  activeSession = null;
  window.dispatchEvent(new CustomEvent("swipeword:study-session-cleared"));
};

export const restartStudySession = (mode: StudyMode = "today") => {
  clearStudySession();
  return createStudySession(mode);
};
