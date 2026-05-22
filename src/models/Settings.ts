export type AppSettings = {
  dailyNewCount: number;
  autoPronounce: boolean;
  accent: "en-US" | "en-GB";
  showDefinition: boolean;
  showExamples: boolean;
  selectedBookId: string;
};

export const defaultSettings: AppSettings = {
  dailyNewCount: 20,
  autoPronounce: false,
  accent: "en-US",
  showDefinition: true,
  showExamples: true,
  selectedBookId: "cet4-core",
};
