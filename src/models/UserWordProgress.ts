export type WordStatus = "new" | "learning" | "weak" | "review" | "mastered";

export type UserWordProgress = {
  wordId: string;
  status: WordStatus;
  familiarity: number;
  rightCount: number;
  wrongCount: number;
  fuzzyCount: number;
  isFavorite: boolean;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  recognitionScore: number;
  spellingScore: number;
};
