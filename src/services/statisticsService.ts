import { words } from "../data/words";
import { loadProgressMap, loadReviewLogs, loadSettings } from "../storage/localStorage";
import { isDue, sameLocalDay } from "../utils/dateUtils";
import { getWordBookById, getWordIdsByBookId } from "./wordBookService";

export const getStatistics = () => {
  const progressMap = loadProgressMap();
  const logs = loadReviewLogs();
  const settings = loadSettings();
  const today = new Date();
  const selectedBook = getWordBookById(settings.selectedBookId);
  const selectedIds = getWordIdsByBookId(settings.selectedBookId);

  const todayLogs = logs.filter((log) => sameLocalDay(new Date(log.reviewedAt), today));
  const masteredCount = selectedIds.filter((id) => progressMap[id].status === "mastered").length;
  const weakCount = selectedIds.filter((id) => progressMap[id].status === "weak" || progressMap[id].wrongCount >= 2).length;
  const dueReviewCount = selectedIds.filter((id) => {
    const progress = progressMap[id];
    return progress.status !== "new" && progress.status !== "mastered" && isDue(progress.nextReviewAt, today);
  }).length;
  const newCount = selectedIds.filter((id) => progressMap[id].status === "new").slice(0, settings.dailyNewCount).length;
  const todayTarget = newCount + dueReviewCount;
  const studiedUniqueToday = new Set(todayLogs.map((log) => log.wordId)).size;
  const reviewLogsToday = todayLogs.filter((log) => progressMap[log.wordId]?.status !== "new");

  const learnedDays = Array.from(
    new Set(logs.map((log) => new Date(log.reviewedAt).toLocaleDateString("zh-CN"))),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = day.toLocaleDateString("zh-CN");
    if (learnedDays.includes(key)) streak += 1;
    else if (offset > 0) break;
  }

  const forgettableWords = selectedIds
    .map((id) => ({ word: words.find((item) => item.id === id), progress: progressMap[id] }))
    .filter((item) => item.word && item.progress.wrongCount > 0)
    .sort((a, b) => b.progress.wrongCount + b.progress.fuzzyCount - (a.progress.wrongCount + a.progress.fuzzyCount))
    .slice(0, 5);

  return {
    selectedBook,
    totalWords: selectedIds.length,
    todayNewCount: newCount,
    dueReviewCount,
    weakCount,
    masteredCount,
    progressPercent: selectedIds.length ? Math.round((masteredCount / selectedIds.length) * 100) : 0,
    todayStudiedCount: studiedUniqueToday,
    todayTarget,
    todayCompletionRate: todayTarget ? Math.min(100, Math.round((studiedUniqueToday / todayTarget) * 100)) : 100,
    reviewCompletionRate: dueReviewCount ? Math.min(100, Math.round((reviewLogsToday.length / dueReviewCount) * 100)) : 100,
    streak,
    forgettableWords,
  };
};
