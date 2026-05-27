export type GestureFeedbackType = "none" | "known" | "unknown" | "peek" | "fuzzy";

export type GestureFeedbackState = {
  preview: Exclude<GestureFeedbackType, "fuzzy">;
  committed: GestureFeedbackType;
  progress: number;
};

export const idleGestureFeedback: GestureFeedbackState = {
  preview: "none",
  committed: "none",
  progress: 0,
};
