import { defaultWordBooks, getWordBookWordIds, wordBookMetas } from "../data/wordBooks";
import { wordById } from "../data/words";
import type { UserWordProgress } from "../models/UserWordProgress";

export type WordBookProgressStats = {
  totalWordCount: number;
  learnedWordCount: number;
  knownCount: number;
  unknownCount: number;
  fuzzyCount: number;
};

export const getDefaultBookId = () => "cet4-core";

export const getWordBookMetas = () => wordBookMetas;

export const validateBookId = (bookId?: string) => {
  const migratedBookId = bookId === "postgraduate" ? "postgraduate-core" : bookId;
  return wordBookMetas.some((book) => book.id === migratedBookId) ? migratedBookId as string : getDefaultBookId();
};

export const getWordBookById = (bookId?: string) => {
  const safeBookId = validateBookId(bookId);
  return defaultWordBooks.find((book) => book.id === safeBookId) ?? defaultWordBooks[0];
};

export const getWordsByBookId = (bookId?: string) =>
  getWordBookWordIds(validateBookId(bookId))
    .map((id) => wordById.get(id))
    .filter((word): word is NonNullable<typeof word> => Boolean(word));

export const getWordIdsByBookId = (bookId?: string) => getWordsByBookId(bookId).map((word) => word.id);

const hasTouchedWord = (progress?: UserWordProgress) =>
  Boolean(
    progress &&
      (progress.status !== "new" ||
        progress.familiarity > 0 ||
        progress.rightCount > 0 ||
        progress.wrongCount > 0 ||
        progress.fuzzyCount > 0 ||
        progress.lastReviewedAt),
  );

export const getWordBookProgressStats = (
  bookId: string | undefined,
  progressMap: Record<string, UserWordProgress>,
): WordBookProgressStats => {
  const wordIds = getWordIdsByBookId(bookId);
  return wordIds.reduce<WordBookProgressStats>(
    (stats, id) => {
      const progress = progressMap[id];
      const learned = hasTouchedWord(progress);
      const known =
        progress?.status === "mastered" ||
        (Boolean(progress?.rightCount) && !progress?.wrongCount && !progress?.fuzzyCount && progress.status !== "weak");
      const unknown = progress?.status === "weak" || Boolean(progress?.wrongCount);
      const fuzzy = Boolean(progress?.fuzzyCount);

      return {
        totalWordCount: stats.totalWordCount,
        learnedWordCount: stats.learnedWordCount + (learned ? 1 : 0),
        knownCount: stats.knownCount + (known ? 1 : 0),
        unknownCount: stats.unknownCount + (unknown ? 1 : 0),
        fuzzyCount: stats.fuzzyCount + (fuzzy ? 1 : 0),
      };
    },
    {
      totalWordCount: wordIds.length,
      learnedWordCount: 0,
      knownCount: 0,
      unknownCount: 0,
      fuzzyCount: 0,
    },
  );
};
