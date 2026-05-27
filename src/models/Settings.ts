export type AppSettings = {
  dailyNewCount: number;
  dailyReviewLimit: number | "unlimited";
  prioritizeWeakWords: boolean;
  wordOrder: "sequential" | "random";
  shuffleLearning: boolean;
  autoPronounce: boolean;
  accent: "en-US" | "en-GB";
  speechRate: 0.85 | 1 | 1.15;
  tapWordPronounce: boolean;
  tapExamplePronounce: boolean;
  showPhonetic: boolean;
  showDefinition: boolean;
  showExamples: boolean;
  showCollocations: boolean;
  showSynonyms: boolean;
  showMemoryHint: boolean;
  cardTextSize: "small" | "standard" | "large";
  reviewIntensity: "light" | "standard" | "intense";
  wrongWordReappear: "laterInSession" | "after5min" | "tomorrow";
  peekBehavior: "markFuzzy";
  keepMasteredLowFrequencyReview: boolean;
  swipeSensitivity: "conservative" | "standard" | "sensitive";
  cardAnimationStrength: "soft" | "standard" | "strong";
  doubleTapFavorite: boolean;
  rightSwipeRecallBar: boolean;
  bottomGestureHint: boolean;
  hapticFeedback: boolean;
  selectedBookId: string;
};

export const defaultSettings: AppSettings = {
  dailyNewCount: 20,
  dailyReviewLimit: "unlimited",
  prioritizeWeakWords: true,
  wordOrder: "sequential",
  shuffleLearning: false,
  autoPronounce: false,
  accent: "en-US",
  speechRate: 1,
  tapWordPronounce: true,
  tapExamplePronounce: true,
  showPhonetic: true,
  showDefinition: true,
  showExamples: true,
  showCollocations: true,
  showSynonyms: true,
  showMemoryHint: true,
  cardTextSize: "standard",
  reviewIntensity: "standard",
  wrongWordReappear: "laterInSession",
  peekBehavior: "markFuzzy",
  keepMasteredLowFrequencyReview: true,
  swipeSensitivity: "standard",
  cardAnimationStrength: "standard",
  doubleTapFavorite: true,
  rightSwipeRecallBar: true,
  bottomGestureHint: true,
  hapticFeedback: false,
  selectedBookId: "cet4-core",
};
