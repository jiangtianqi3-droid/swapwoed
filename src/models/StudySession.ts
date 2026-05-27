import type { AppSettings } from "./Settings";

export type StudySession = {
  sessionId: string;
  mode: "today" | "new" | "review" | "weak";
  bookId: string;
  wordOrder: "sequential" | "random";
  queueWordIds: string[];
  currentIndex: number;
  createdAt: number;
  createdDate: string;
  settingsSnapshot: {
    selectedBookId: string;
    wordOrder: "sequential" | "random";
    dailyNewCount: number;
    dailyReviewLimit: AppSettings["dailyReviewLimit"];
  };
};
