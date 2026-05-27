export type Word = {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  definition?: string;
  examples: string[];
  collocations?: string[];
  synonyms?: string[];
  memoryHint?: string;
  tags?: string[];
};

export type WordBook = {
  id: string;
  name: string;
  description: string;
  wordIds: string[];
  isCustom?: boolean;
};

export type WordBookMeta = {
  id: string;
  name: string;
  description: string;
  category: "exam" | "daily" | "tech" | "custom";
  level: "beginner" | "intermediate" | "advanced";
  wordCount: number;
  version: string;
  builtIn: boolean;
};

export type WordItem = {
  id: string;
  bookId: string;
  word: string;
  phoneticUS?: string;
  phoneticUK?: string;
  meanings: {
    partOfSpeech: string;
    meaning: string;
  }[];
  englishDefinition?: string;
  examples?: {
    en: string;
    zh?: string;
  }[];
  collocations?: string[];
  synonyms?: string[];
  tags?: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
};
