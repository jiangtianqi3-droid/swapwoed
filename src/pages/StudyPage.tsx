import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { RotateCcw, Settings } from "lucide-react";
import StudyProgressMarks from "../components/StudyProgressMarks";
import WordCard, { type CardStudyAction } from "../components/WordCard";
import { wordById } from "../data/words";
import { idleGestureFeedback, type GestureFeedbackState } from "../models/GestureFeedbackState";
import type { Word } from "../models/Word";
import type { SwipeAction } from "../models/ReviewLog";
import { loadProgressMap, loadSettings, saveLastSummary, type StudySummary } from "../storage/localStorage";
import {
  handleSwipe,
  toggleFavorite,
  undoSwipe,
  type StudyMode,
  type SwipeResult,
} from "../services/wordProgressService";
import {
  getOrCreateStudySession,
  setStudySessionIndex,
  setStudySessionQueue,
} from "../services/studySessionService";

type UndoEntry = {
  result: SwipeResult;
  action: SwipeAction;
  becameWeak: boolean;
  word: Word;
  countedInSummary: boolean;
};

type RecallEntry = UndoEntry & {
  expiresAt: number;
};

const modeTitle: Record<StudyMode, string> = {
  today: "今日任务",
  new: "新词模式",
  review: "复习模式",
  weak: "薄弱词模式",
};

const emptySummary: StudySummary = {
  studiedCount: 0,
  right: 0,
  wrong: 0,
  fuzzy: 0,
  easy: 0,
  newWeakCount: 0,
};

const summaryAfterAction = (summary: StudySummary, action: SwipeAction, becameWeak: boolean): StudySummary => ({
  ...summary,
  studiedCount: summary.studiedCount + 1,
  right: summary.right + (action === "right" ? 1 : 0),
  wrong: summary.wrong + (action === "left" ? 1 : 0),
  fuzzy: summary.fuzzy + (action === "up" ? 1 : 0),
  easy: summary.easy + (action === "down" ? 1 : 0),
  newWeakCount: summary.newWeakCount + (becameWeak ? 1 : 0),
});

const summaryAfterUndo = (summary: StudySummary, entry: UndoEntry): StudySummary => ({
  ...summary,
  studiedCount: Math.max(0, summary.studiedCount - 1),
  right: Math.max(0, summary.right - (entry.action === "right" ? 1 : 0)),
  wrong: Math.max(0, summary.wrong - (entry.action === "left" ? 1 : 0)),
  fuzzy: Math.max(0, summary.fuzzy - (entry.action === "up" ? 1 : 0)),
  easy: Math.max(0, summary.easy - (entry.action === "down" ? 1 : 0)),
  newWeakCount: Math.max(0, summary.newWeakCount - (entry.becameWeak ? 1 : 0)),
});

export default function StudyPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = ((params.mode as StudyMode | undefined) ?? "today") in modeTitle ? ((params.mode as StudyMode) ?? "today") : "today";
  const [queueIds, setQueueIds] = useState(() => getOrCreateStudySession(mode).queueWordIds);
  const [progressMap, setProgressMap] = useState(() => loadProgressMap());
  const [settings, setSettings] = useState(() => loadSettings());
  const [currentIndex, setCurrentIndexState] = useState(() => getOrCreateStudySession(mode).currentIndex);
  const [, setUndoStack] = useState<UndoEntry[]>([]);
  const [summary, setSummary] = useState<StudySummary>(emptySummary);
  const [recall, setRecall] = useState<RecallEntry | null>(null);
  const [recallEnteringWordId, setRecallEnteringWordId] = useState<string | null>(null);
  const [dealOnNextCard, setDealOnNextCard] = useState(true);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedbackState>(idleGestureFeedback);
  const summaryRef = useRef(summary);

  const queue = useMemo(
    () => queueIds.map((id) => wordById.get(id)).filter((word): word is Word => Boolean(word)),
    [queueIds],
  );
  const currentWord = queue[currentIndex];
  const stackWords = queue.slice(currentIndex + 1, currentIndex + 7);
  const currentProgress = currentWord ? progressMap[currentWord.id] : null;

  const setCurrentIndex = (nextIndex: number | ((value: number) => number)) => {
    setCurrentIndexState((value) => {
      const resolved = typeof nextIndex === "function" ? nextIndex(value) : nextIndex;
      setStudySessionIndex(resolved);
      return resolved;
    });
  };

  const replaceQueueIds = (nextIds: string[], nextIndex = currentIndex) => {
    setQueueIds(nextIds);
    setStudySessionQueue(nextIds, nextIndex);
  };

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  useEffect(() => {
    const nextSession = getOrCreateStudySession(mode);
    setQueueIds(nextSession.queueWordIds);
    setCurrentIndexState(nextSession.currentIndex);
  }, [mode]);

  useEffect(() => {
    const onSettingsChanged = () => setSettings(loadSettings());
    const onSessionCleared = () => {
      const nextSession = getOrCreateStudySession(mode);
      setQueueIds(nextSession.queueWordIds);
      setCurrentIndexState(nextSession.currentIndex);
      setProgressMap(loadProgressMap());
      setSummary(emptySummary);
      summaryRef.current = emptySummary;
      setRecall(null);
      setDealOnNextCard(true);
    };

    window.addEventListener("swipeword:settings-changed", onSettingsChanged);
    window.addEventListener("swipeword:study-session-cleared", onSessionCleared);
    return () => {
      window.removeEventListener("swipeword:settings-changed", onSettingsChanged);
      window.removeEventListener("swipeword:study-session-cleared", onSessionCleared);
    };
  }, [mode]);

  useEffect(() => {
    if (location.pathname === "/settings") return;
    document.body.classList.add("study-scroll-locked");
    return () => document.body.classList.remove("study-scroll-locked");
  }, [location.pathname]);

  const nextReviewAt = useMemo(() => {
    const dates = Object.values(progressMap)
      .map((progress) => progress.nextReviewAt)
      .filter(Boolean)
      .sort() as string[];
    return dates[0];
  }, [progressMap]);

  const finishSession = (nextSummary: StudySummary, newestReviewAt?: string) => {
    const sortedReviewTimes = [nextReviewAt, newestReviewAt].filter(Boolean).sort() as string[];
    saveLastSummary({ ...nextSummary, nextReviewAt: sortedReviewTimes[0] });
    navigate("/summary");
  };

  const advanceQueue = (nextSummary: StudySummary, newestReviewAt?: string) => {
    const nextIndex = currentIndex + 1;
    setGestureFeedback(idleGestureFeedback);
    setCurrentIndex(nextIndex);
    if (nextIndex >= queue.length) finishSession(nextSummary, newestReviewAt);
  };

  const recordSwipe = (action: SwipeAction, options?: { advance?: boolean; countedInSummary?: boolean; allowRecall?: boolean }) => {
    if (!currentWord) return;
    const advance = options?.advance ?? true;
    const countedInSummary = options?.countedInSummary ?? true;
    const result = handleSwipe(currentWord.id, action);
    const becameWeak = result.previousProgress.status !== "weak" && result.nextProgress.status === "weak";
    const nextSummary = countedInSummary ? summaryAfterAction(summary, action, becameWeak) : summary;
    const entry: UndoEntry = { result, action, becameWeak, word: currentWord, countedInSummary };

    setProgressMap((map) => ({ ...map, [currentWord.id]: result.nextProgress }));
    setUndoStack((stack) => [...stack, entry]);
    setSummary(nextSummary);
    summaryRef.current = nextSummary;

    if (options?.allowRecall) {
      const recallEntry: RecallEntry = { ...entry, expiresAt: Date.now() + 3000 };
      setRecall(recallEntry);
      window.setTimeout(() => {
        setRecall((value) => (value?.result.logId === recallEntry.result.logId ? null : value));
      }, 3000);
    }

    if (advance) {
      setDealOnNextCard(false);
      advanceQueue(nextSummary, result.nextProgress.nextReviewAt);
    }
  };

  const moveCurrentToBack = () => {
    if (!currentWord) return;
    const remainingAfterCurrent = queue.slice(currentIndex + 1);
    if (!remainingAfterCurrent.length) {
      setDealOnNextCard(false);
      advanceQueue(summaryRef.current);
      return;
    }

    setDealOnNextCard(false);
    const completed = queueIds.slice(0, currentIndex);
    const remaining = queueIds.slice(currentIndex + 1).filter((id) => id !== currentWord.id);
    replaceQueueIds([...completed, ...remaining, currentWord.id], currentIndex);
  };

  const undoEntry = (last: UndoEntry, options?: { restoreToCurrent?: boolean }) => {
    if (!last) return;
    undoSwipe(last.result);
    setUndoStack((stack) => stack.filter((entry) => entry.result.logId !== last.result.logId));
    setProgressMap((map) => ({ ...map, [last.result.wordId]: last.result.previousProgress }));
    if (last.countedInSummary) setSummary((value) => summaryAfterUndo(value, last));
    if (options?.restoreToCurrent) {
      const completed = queueIds.slice(0, currentIndex);
      const remaining = queueIds.slice(currentIndex).filter((id) => id !== last.word.id);
      replaceQueueIds([...completed, last.word.id, ...remaining], currentIndex);
      setDealOnNextCard(true);
      setRecallEnteringWordId(last.word.id);
      window.setTimeout(() => {
        setRecallEnteringWordId((wordId) => (wordId === last.word.id ? null : wordId));
      }, 520);
      setRecall(null);
      return;
    }
    setCurrentIndex((value) => Math.max(0, value - 1));
  };

  const onCardAction = (action: CardStudyAction) => {
    if (action === "rightKnown") {
      recordSwipe("right", { advance: true, countedInSummary: true, allowRecall: settings.rightSwipeRecallBar });
      return;
    }

    if (action === "leftUnknown") {
      recordSwipe("left", { advance: false, countedInSummary: true });
      return;
    }

    if (action === "peekFuzzy") {
      recordSwipe("up", { advance: false, countedInSummary: true });
      return;
    }

    if (action === "dismissPeekedAnswer" || action === "dismissAnswerOnly") {
      moveCurrentToBack();
      return;
    }
  };

  const onToggleFavorite = () => {
    if (!currentWord) return;
    const isFavorite = toggleFavorite(currentWord.id);
    setProgressMap((map) => ({
      ...map,
      [currentWord.id]: { ...map[currentWord.id], isFavorite },
    }));
  };

  if (!currentWord || !currentProgress) {
    return (
      <div className="page study-empty">
        <h1>{modeTitle[mode]}</h1>
        <p>当前没有需要学习的单词。可以切换词库、增加每日新词，或者稍后回来复习。</p>
        <div className="button-row">
          <Link className="secondary-action" to="/">
            返回首页
          </Link>
          <Link className="secondary-action" to="/books">
            查看词库
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page study-page">
      <header className="study-topbar">
        <StudyProgressMarks
          bookId={settings.selectedBookId}
          currentWordId={currentWord.id}
          todayCompletedCount={currentIndex}
          todayMaxWordCount={queueIds.length}
          progressMap={progressMap}
          feedback={gestureFeedback}
        />
        <Link className="top-icon-link" to="/settings" state={{ backgroundLocation: location }} aria-label="设置">
          <Settings size={19} />
        </Link>
      </header>

      <WordCard
        key={currentWord.id}
        word={currentWord}
        stackWords={stackWords}
        progress={currentProgress}
        settings={settings}
        recallEntering={recallEnteringWordId === currentWord.id}
        dealOnEnter={dealOnNextCard || recallEnteringWordId === currentWord.id}
        onAction={onCardAction}
        onToggleFavorite={onToggleFavorite}
        onFeedbackChange={setGestureFeedback}
      />

      {settings.rightSwipeRecallBar && recall && Date.now() < recall.expiresAt ? (
        <button
          className="recall-toast"
          key={recall.result.logId}
          type="button"
          onClick={() => undoEntry(recall, { restoreToCurrent: true })}
        >
          <RotateCcw size={16} />
          <span>{recall.word.word}</span>
          <strong>{recall.word.meaning}</strong>
        </button>
      ) : null}

      {settings.bottomGestureHint ? (
        <div className="gesture-ghost" aria-hidden="true">
          <span className="gesture-arrow gesture-arrow-left" />
          <i className="gesture-dot" />
          <span className="gesture-arrow gesture-arrow-right" />
        </div>
      ) : null}
    </div>
  );
}
