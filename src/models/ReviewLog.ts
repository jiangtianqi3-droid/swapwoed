export type SwipeAction = "left" | "right" | "up" | "down";

export type ReviewLog = {
  id: string;
  wordId: string;
  action: SwipeAction;
  reviewedAt: string;
};
