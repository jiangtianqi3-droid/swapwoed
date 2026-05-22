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
