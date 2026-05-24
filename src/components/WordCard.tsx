import { useEffect, useRef, useState } from "react";
import { BookmarkCheck, Check, CircleHelp, X } from "lucide-react";
import { exampleTranslations } from "../data/exampleTranslations";
import type { AppSettings } from "../models/Settings";
import type { UserWordProgress } from "../models/UserWordProgress";
import type { Word } from "../models/Word";

export type CardStudyAction = "rightKnown" | "leftUnknown" | "peekFuzzy" | "dismissAnswerOnly" | "dismissPeekedAnswer";

type WordCardProps = {
  word: Word;
  stackWords?: Word[];
  progress: UserWordProgress;
  settings: AppSettings;
  recallEntering?: boolean;
  dealOnEnter?: boolean;
  onAction: (action: CardStudyAction) => void;
  onToggleFavorite: () => void;
};

type Drag = { x: number; y: number };
type GestureLock = "none" | "horizontal" | "vertical";
type PeekOrigin = "idle" | "right";
type AnswerMotionMode = "undecided" | "follow" | "stay";
type CardPhase =
  | "idle"
  | "dealing"
  | "horizontalDragging"
  | "rightHesitating"
  | "verticalPeekingFromIdle"
  | "verticalPeekingFromRight"
  | "leftCommitted"
  | "rightCommitted"
  | "answerActive"
  | "returningWordToStack"
  | "dismissPeekedAnswer"
  | "returningAnswerToStack"
  | "exiting";

const DEAD_ZONE = 12;
const DIRECTION_RATIO = 1.18;
const HORIZONTAL_COMMIT = 128;
const FUZZY_RIGHT_DISMISS = 92;
const FUZZY_RIGHT_EXTRA_DISMISS = 54;
const FAST_RIGHT_DISTANCE = 58;
const FAST_RIGHT_VELOCITY = 0.68;
const RIGHT_HESITATE_START = 24;
const HESITATION_MS = 1200;
const HESITATION_DOWN_SHIFT = 18;
const MAX_PEEK_OFFSET = 190;
const REVEAL_MEANING_THRESHOLD = 78;
const WORD_REVEAL_MEANING_THRESHOLD = 128;
const PARTIAL_REVEAL_THRESHOLD = 44;
const EXIT_MS = 520;
const LEFT_REVEAL_MS = 340;
const TAP_DISTANCE = 8;
const DOUBLE_TAP_MS = 260;
const VELOCITY_COMMIT = 0.7;

export const speakText = (text: string, accent: AppSettings["accent"], rate = 0.88) => {
  if (!text.trim() || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
};

export const speakWord = (word: string, accent: AppSettings["accent"], rate: AppSettings["speechRate"] = 1) =>
  speakText(word, accent, rate);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const wordTitleSize = (text: string) => {
  const length = Array.from(text).length;
  if (length <= 8) return undefined;
  if (length <= 10) return "clamp(2.12rem, 10vw, 3.55rem)";
  if (length <= 12) return "clamp(1.9rem, 8.4vw, 3rem)";
  if (length <= 15) return "clamp(1.62rem, 7vw, 2.45rem)";
  return "clamp(1.35rem, 5.8vw, 2.05rem)";
};

const AnswerContent = ({ word, settings }: { word: Word; settings: AppSettings }) => {
  const example = word.examples[0];
  const exampleTranslation = exampleTranslations[word.id];

  return (
  <>
    <div className="word-back-header">
      <div>
        <div className="answer-word-line">
          <strong>{word.word}</strong>
          <span>{word.phonetic}</span>
        </div>
        <h2>{word.meaning}</h2>
        <p>{word.partOfSpeech}</p>
      </div>
    </div>

    {settings.showDefinition && word.definition ? <p className="definition">{word.definition}</p> : null}
    {settings.showExamples && example ? (
      <blockquote>
        <span>{example}</span>
        {exampleTranslation ? <cite>{exampleTranslation}</cite> : null}
      </blockquote>
    ) : null}

    <div className="detail-grid">
      {settings.showCollocations && word.collocations?.length ? (
        <div>
          <span>常见搭配</span>
          <p>{word.collocations.slice(0, 2).join(" / ")}</p>
        </div>
      ) : null}
      {settings.showSynonyms && word.synonyms?.length ? (
        <div>
          <span>近义词</span>
          <p>{word.synonyms.slice(0, 3).join(" / ")}</p>
        </div>
      ) : null}
      {settings.showMemoryHint && word.memoryHint ? (
        <div>
          <span>记忆提示</span>
          <p>{word.memoryHint}</p>
        </div>
      ) : null}
    </div>
  </>
  );
};

const FrontWordContent = ({ word, interactive, settings }: { word: Word; interactive?: boolean; settings?: AppSettings }) => (
  <div className="word-main">
    {interactive && settings ? (
      <button
        className="word-title word-pronounce"
        type="button"
        style={{ fontSize: wordTitleSize(word.word) }}
        onClick={(event) => {
          event.stopPropagation();
          if (settings.tapWordPronounce) speakWord(word.word, settings.accent, settings.speechRate);
        }}
      >
        {word.word}
      </button>
    ) : (
      <div className="word-title" style={{ fontSize: wordTitleSize(word.word) }}>
        {word.word}
      </div>
    )}
    {!settings || settings.showPhonetic ? <p>{word.phonetic}</p> : null}
  </div>
);

export default function WordCard({
  word,
  stackWords = [],
  progress,
  settings,
  recallEntering = false,
  dealOnEnter = true,
  onAction,
  onToggleFavorite,
}: WordCardProps) {
  const [phase, setPhase] = useState<CardPhase>(dealOnEnter ? "dealing" : "idle");
  const [wordDrag, setWordDrag] = useState<Drag>({ x: 0, y: 0 });
  const [answerDrag, setAnswerDrag] = useState<Drag>({ x: 0, y: 0 });
  const [stackDrag, setStackDrag] = useState<Drag>({ x: 0, y: 0 });
  const [peekOffset, setPeekOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [isHesitatingRight, setIsHesitatingRight] = useState(false);
  const [wordHidden, setWordHidden] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [favoritePulse, setFavoritePulse] = useState(false);

  const startRef = useRef({ x: 0, y: 0 });
  const currentDeltaRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
  const velocityXRef = useRef(0);
  const velocityYRef = useRef(0);
  const lockRef = useRef<GestureLock>("none");
  const peekOriginRef = useRef<PeekOrigin>("idle");
  const targetRef = useRef<"word" | "answer">("word");
  const hesitationTimer = useRef<number | null>(null);
  const hesitationOriginRef = useRef({ x: 0, y: 0 });
  const peekRecordedRef = useRef(false);
  const leftRecordedRef = useRef(false);
  const gestureCommittedRef = useRef(false);
  const answerMotionModeRef = useRef<AnswerMotionMode>("undecided");
  const partialRevealRef = useRef(false);
  const fullRevealRef = useRef(false);
  const dragExceededRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef(0);
  const dealTimerRef = useRef<number | null>(null);

  const clearHesitation = () => {
    if (hesitationTimer.current) window.clearTimeout(hesitationTimer.current);
    hesitationTimer.current = null;
  };

  const clearClickTimer = () => {
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = null;
  };

  const clearDealTimer = () => {
    if (dealTimerRef.current) window.clearTimeout(dealTimerRef.current);
    dealTimerRef.current = null;
  };

  useEffect(() => {
    clearDealTimer();
    setPhase(dealOnEnter ? "dealing" : "idle");
    setWordDrag({ x: 0, y: 0 });
    setAnswerDrag({ x: 0, y: 0 });
    setStackDrag({ x: 0, y: 0 });
    setPeekOffset(0);
    setIsDragging(false);
    setHasPeeked(false);
    setIsHesitatingRight(false);
    setWordHidden(false);
    setShowExample(false);
    setFavoritePulse(false);
    lockRef.current = "none";
    peekOriginRef.current = "idle";
    targetRef.current = "word";
    currentDeltaRef.current = { x: 0, y: 0 };
    lastMoveRef.current = { x: 0, y: 0, time: 0 };
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    peekRecordedRef.current = false;
    leftRecordedRef.current = false;
    gestureCommittedRef.current = false;
    answerMotionModeRef.current = "undecided";
    partialRevealRef.current = false;
    fullRevealRef.current = false;
    dragExceededRef.current = false;
    clearHesitation();
    clearClickTimer();
    if (dealOnEnter) dealTimerRef.current = window.setTimeout(() => setPhase("idle"), 420);
  }, [word.id]);

  useEffect(() => {
    if (settings.autoPronounce) speakWord(word.word, settings.accent, settings.speechRate);
  }, [settings.accent, settings.autoPronounce, settings.speechRate, word.word]);

  useEffect(
    () => () => {
      clearHesitation();
      clearClickTimer();
      clearDealTimer();
    },
    [],
  );

  const beginDrag = (event: React.PointerEvent<HTMLElement>, target: "word" | "answer") => {
    if (phase === "exiting" || phase === "dealing") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { x: event.clientX, y: event.clientY };
    currentDeltaRef.current = { x: 0, y: 0 };
    targetRef.current = target;
    lockRef.current = "none";
    peekOriginRef.current = "idle";
    lastMoveRef.current = { x: event.clientX, y: event.clientY, time: performance.now() };
    velocityXRef.current = 0;
    velocityYRef.current = 0;
    gestureCommittedRef.current = false;
    answerMotionModeRef.current = "undecided";
    partialRevealRef.current = false;
    fullRevealRef.current = false;
    dragExceededRef.current = false;
    setIsDragging(true);
    if (target === "word") {
      setIsHesitatingRight(false);
      clearHesitation();
    }
  };

  const recordPeekIfNeeded = (offset: number) => {
    if (peekRecordedRef.current || offset < REVEAL_MEANING_THRESHOLD) return;
    peekRecordedRef.current = true;
    setHasPeeked(true);
    onAction("peekFuzzy");
  };

  const forceRecordPeek = () => {
    if (peekRecordedRef.current) return;
    peekRecordedRef.current = true;
    setHasPeeked(true);
    onAction("peekFuzzy");
  };

  const lockDirection = (rawX: number, rawY: number) => {
    if (lockRef.current !== "none") return lockRef.current;

    const absX = Math.abs(rawX);
    const absY = Math.abs(rawY);
    if (Math.max(absX, absY) <= DEAD_ZONE) return "none";

    if (rawX < -DEAD_ZONE && absY < absX * 1.8 + 24) lockRef.current = "horizontal";
    else if (rawX > DEAD_ZONE && absX > absY * 0.62) lockRef.current = "horizontal";
    else if (absX > absY * DIRECTION_RATIO) lockRef.current = "horizontal";
    else if (rawY > DEAD_ZONE && (absX < 52 || absY > absX * 1.35)) lockRef.current = "vertical";
    return lockRef.current;
  };

  const markRightHesitating = () => {
    const { x, y } = currentDeltaRef.current;
    const stillInRange =
      (Math.abs(x) > RIGHT_HESITATE_START || y > RIGHT_HESITATE_START) &&
      !peekRecordedRef.current &&
      answerMotionModeRef.current === "follow" &&
      isDragging &&
      phase !== "rightCommitted" &&
      phase !== "exiting";
    if (!stillInRange || lockRef.current !== "horizontal") return;
    hesitationOriginRef.current = { x, y };
    setPhase("rightHesitating");
    setIsHesitatingRight(true);
  };

  const scheduleRightHesitation = (rawX: number, rawY: number) => {
    const canHesitate =
      (Math.abs(rawX) > RIGHT_HESITATE_START || rawY > RIGHT_HESITATE_START) &&
      !peekRecordedRef.current &&
      answerMotionModeRef.current === "follow" &&
      lockRef.current === "horizontal" &&
      phase !== "rightCommitted" &&
      phase !== "exiting";

    if (!canHesitate) {
      setIsHesitatingRight(false);
      clearHesitation();
      return;
    }

    if (hesitationTimer.current) return;
    hesitationTimer.current = window.setTimeout(markRightHesitating, HESITATION_MS);
  };

  const applyVerticalPeek = (rawX: number, rawY: number, fromHesitation: boolean) => {
    clearHesitation();
    setIsHesitatingRight(fromHesitation);
    lockRef.current = "vertical";
    peekOriginRef.current = fromHesitation ? "right" : "idle";
    const baseY = fromHesitation ? hesitationOriginRef.current.y : 0;
    const peekY = clamp(rawY - baseY, 0, 220);
    const nextPeekOffset = clamp(peekY * 0.45, 0, MAX_PEEK_OFFSET);
    setPhase(fromHesitation ? "verticalPeekingFromRight" : "verticalPeekingFromIdle");
    if (fromHesitation) {
      setStackDrag({ x: rawX, y: clamp(baseY * 0.14, -18, 26) });
      setWordDrag({ x: 0, y: peekY });
    } else {
      setStackDrag({ x: 0, y: 0 });
      setWordDrag({ x: rawX * 0.04, y: clamp(rawY, 0, 220) });
    }
    setPeekOffset(nextPeekOffset);
    recordPeekIfNeeded(nextPeekOffset);
  };

  const commitFuzzyRightDismiss = (rawX: number, rawY: number) => {
    if (gestureCommittedRef.current) return;
    gestureCommittedRef.current = true;
    forceRecordPeek();
    clearHesitation();
    setIsHesitatingRight(false);
    setIsDragging(false);
    setPhase("exiting");
    setStackDrag({ x: window.innerWidth + 260, y: clamp(rawY * 0.12, -28, 34) });
    window.setTimeout(() => onAction("dismissPeekedAnswer"), EXIT_MS);
  };

  const moveWordCards = (rawX: number, rawY: number) => {
    const absX = Math.abs(rawX);
    const absY = Math.abs(rawY);
    const withinDeadZone = Math.max(absX, absY) <= DEAD_ZONE;
    if (withinDeadZone && answerMotionModeRef.current === "undecided") {
      setPhase("horizontalDragging");
      setWordDrag({ x: rawX, y: rawY });
      setStackDrag({ x: 0, y: 0 });
      setPeekOffset(0);
      return;
    }

    const startsRight = rawX > DEAD_ZONE && rawX > absY * 0.45;
    const startsUp = rawY < -DEAD_ZONE && absY > absX * 0.45;
    const startsFollow = startsRight || startsUp;
    if (answerMotionModeRef.current === "undecided") {
      answerMotionModeRef.current = startsFollow ? "follow" : "stay";
      if (startsFollow) peekOriginRef.current = "right";
    }

    const followsAnswer = answerMotionModeRef.current === "follow";
    const revealAmount = followsAnswer
      ? peekOffset
      : Math.max(rawY, rawX < 0 ? -rawX * 0.92 : 0);
    if (revealAmount >= PARTIAL_REVEAL_THRESHOLD) partialRevealRef.current = true;
    if (revealAmount >= WORD_REVEAL_MEANING_THRESHOLD) fullRevealRef.current = true;

    const hesitationDown = followsAnswer && isHesitatingRight && rawY - hesitationOriginRef.current.y > HESITATION_DOWN_SHIFT;
    const nextPeekOffset = hesitationDown
      ? clamp((rawY - hesitationOriginRef.current.y) * 0.78, 0, MAX_PEEK_OFFSET)
      : peekOffset;
    if (nextPeekOffset >= PARTIAL_REVEAL_THRESHOLD) partialRevealRef.current = true;
    if (nextPeekOffset >= WORD_REVEAL_MEANING_THRESHOLD) fullRevealRef.current = true;

    const fastRight = rawX > FAST_RIGHT_DISTANCE && velocityXRef.current > FAST_RIGHT_VELOCITY && !partialRevealRef.current && followsAnswer;
    setPeekOffset(0);
    setPhase(hesitationDown ? "verticalPeekingFromRight" : isHesitatingRight ? "rightHesitating" : "horizontalDragging");

    if (!followsAnswer) {
      lockRef.current = rawY > 28 && rawY > absX * 0.58 ? "vertical" : "horizontal";
      setIsHesitatingRight(false);
      clearHesitation();
      setStackDrag({ x: 0, y: 0 });
      setWordDrag({ x: rawX, y: rawY });
      return;
    }

    lockRef.current = "horizontal";
    setWordDrag({ x: 0, y: 0 });
    setStackDrag({ x: rawX, y: rawY });
    setPeekOffset(nextPeekOffset);
    if ((Math.abs(rawX) > RIGHT_HESITATE_START || rawY > RIGHT_HESITATE_START) && !partialRevealRef.current) {
      scheduleRightHesitation(rawX, rawY);
    }
    else clearHesitation();
    if (fastRight && !partialRevealRef.current) {
      setIsHesitatingRight(false);
      clearHesitation();
      setPhase("rightCommitted");
    }
  };

  const moveAnswerCard = (rawX: number, rawY: number) => {
    if (lockRef.current === "none" && Math.max(Math.abs(rawX), Math.abs(rawY)) > DEAD_ZONE) {
      lockRef.current = "horizontal";
    }
    setAnswerDrag({ x: rawX, y: rawY });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!isDragging || gestureCommittedRef.current) return;
    const now = performance.now();
    const lastMove = lastMoveRef.current;
    const dt = Math.max(1, now - lastMove.time);
    velocityXRef.current = (event.clientX - lastMove.x) / dt;
    velocityYRef.current = (event.clientY - lastMove.y) / dt;
    lastMoveRef.current = { x: event.clientX, y: event.clientY, time: now };

    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    currentDeltaRef.current = { x: rawX, y: rawY };
    if (Math.hypot(rawX, rawY) > TAP_DISTANCE) dragExceededRef.current = true;

    if (targetRef.current === "answer") moveAnswerCard(rawX, rawY);
    else moveWordCards(rawX, rawY);
  };

  const settleWordCards = () => {
    clearHesitation();
    setIsHesitatingRight(false);

    const followsAnswer = answerMotionModeRef.current === "follow";
    const finalX = followsAnswer ? stackDrag.x : wordDrag.x;
    const finalY = followsAnswer ? stackDrag.y : wordDrag.y;
    const sawMeaning = partialRevealRef.current || fullRevealRef.current || peekRecordedRef.current;
    const shouldRight =
      phase === "rightCommitted" ||
      finalX >= HORIZONTAL_COMMIT ||
      (finalX > RIGHT_HESITATE_START && velocityXRef.current > VELOCITY_COMMIT);
    const shouldFinalLeft = finalX <= -HORIZONTAL_COMMIT || velocityXRef.current < -VELOCITY_COMMIT;
    const shouldFinalDown = finalY >= HORIZONTAL_COMMIT || velocityYRef.current > VELOCITY_COMMIT;
    const shouldKeepAnswer =
      shouldFinalLeft ||
      shouldFinalDown ||
      (!followsAnswer && sawMeaning);
    const shouldLeft = phase === "leftCommitted" || shouldFinalLeft;
    const fuzzyRightExtraX =
      peekOriginRef.current === "right"
        ? currentDeltaRef.current.x - hesitationOriginRef.current.x
        : currentDeltaRef.current.x;
    const fuzzyDismissRight =
      (peekRecordedRef.current || peekOriginRef.current === "right") &&
      (peekOriginRef.current === "right"
        ? fuzzyRightExtraX >= FUZZY_RIGHT_EXTRA_DISMISS ||
          (fuzzyRightExtraX >= 24 && velocityXRef.current > 0.42)
        : currentDeltaRef.current.x >= FUZZY_RIGHT_DISMISS ||
          stackDrag.x >= FUZZY_RIGHT_DISMISS ||
          (currentDeltaRef.current.x > RIGHT_HESITATE_START && velocityXRef.current > 0.42));

    if (shouldRight && !sawMeaning) {
      setPhase("exiting");
      if (followsAnswer) {
        setStackDrag({ x: window.innerWidth + 260, y: clamp(stackDrag.y, -28, 28) });
      } else {
        setWordDrag({ x: window.innerWidth + 260, y: clamp(wordDrag.y, -28, 34) });
      }
      window.setTimeout(() => onAction("rightKnown"), EXIT_MS);
      return;
    }

    if (shouldRight && sawMeaning) {
      forceRecordPeek();
      setPhase(followsAnswer ? "exiting" : "dismissPeekedAnswer");
      if (followsAnswer) {
        setStackDrag({ x: window.innerWidth + 260, y: clamp(stackDrag.y, -28, 34) });
      } else {
        setWordDrag({ x: window.innerWidth + 260, y: clamp(wordDrag.y, -28, 34) });
        setAnswerDrag({ x: -96, y: -82 });
      }
      window.setTimeout(() => onAction("dismissPeekedAnswer"), EXIT_MS);
      return;
    }

    if (shouldKeepAnswer) {
      setPhase("returningWordToStack");
      setWordDrag({ x: -96, y: -82 });
      setStackDrag({ x: 0, y: 0 });
      setPeekOffset(0);
      window.setTimeout(() => {
        if ((shouldLeft || fullRevealRef.current) && !leftRecordedRef.current) {
          leftRecordedRef.current = true;
          onAction("leftUnknown");
        } else if (sawMeaning) {
          forceRecordPeek();
        } else {
          forceRecordPeek();
        }
        setWordHidden(true);
        setWordDrag({ x: 0, y: 0 });
        setPhase("answerActive");
      }, LEFT_REVEAL_MS);
      return;
    }

    if (fuzzyDismissRight) {
      setPhase("exiting");
      setStackDrag({ x: window.innerWidth + 260, y: clamp(stackDrag.y, -28, 34) });
      window.setTimeout(() => onAction("dismissPeekedAnswer"), EXIT_MS);
      return;
    }

    if (peekRecordedRef.current) {
      if (peekOffset < 18 && !wordHidden) {
        setWordDrag({ x: 0, y: 0 });
        setStackDrag({ x: 0, y: 0 });
        setPeekOffset(0);
        setPhase("idle");
        return;
      }
      setWordHidden(true);
      setWordDrag({ x: 0, y: 0 });
      if (!isHesitatingRight) setStackDrag({ x: 0, y: 0 });
      setPeekOffset(0);
      setPhase("answerActive");
      return;
    }

    setWordDrag({ x: 0, y: 0 });
    setStackDrag({ x: 0, y: 0 });
    setPeekOffset(0);
    setPhase("idle");
  };

  const settleAnswerCard = () => {
    const distance = Math.max(Math.abs(answerDrag.x), Math.abs(answerDrag.y));
    const velocity = Math.max(Math.abs(velocityXRef.current), Math.abs(velocityYRef.current));
    if (distance >= HORIZONTAL_COMMIT || velocity > VELOCITY_COMMIT) {
      setPhase(peekRecordedRef.current ? "dismissPeekedAnswer" : "returningAnswerToStack");
      setAnswerDrag({ x: -96, y: -82 });
      window.setTimeout(() => onAction(peekRecordedRef.current ? "dismissPeekedAnswer" : "dismissAnswerOnly"), EXIT_MS);
      return;
    }

    setAnswerDrag({ x: 0, y: 0 });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (!isDragging && !gestureCommittedRef.current) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Some Android WebViews release pointer capture before pointerup.
    }
    if (gestureCommittedRef.current) return;
    setIsDragging(false);
    if (targetRef.current === "answer") settleAnswerCard();
    else settleWordCards();
  };

  const toggleExample = () => {
    if (phase !== "idle" && phase !== "horizontalDragging") return;
    if (dragExceededRef.current || wordHidden) return;
    setShowExample((value) => !value);
  };

  const handleCardClick = () => {
    if (dragExceededRef.current || wordHidden) return;
    const now = performance.now();

    if (settings.doubleTapFavorite && now - lastTapTimeRef.current <= DOUBLE_TAP_MS) {
      clearClickTimer();
      lastTapTimeRef.current = 0;
      onToggleFavorite();
      setFavoritePulse(true);
      window.setTimeout(() => setFavoritePulse(false), 620);
      return;
    }

    lastTapTimeRef.current = now;
    clearClickTimer();
    clickTimerRef.current = window.setTimeout(() => {
      toggleExample();
      clickTimerRef.current = null;
      lastTapTimeRef.current = 0;
    }, DOUBLE_TAP_MS);
  };

  const rightStrength = clamp(Math.max(stackDrag.x, wordDrag.x) / HORIZONTAL_COMMIT, 0, 1);
  const leftStrength = clamp(Math.max(-stackDrag.x, -wordDrag.x) / HORIZONTAL_COMMIT, 0, 1);
  const wordRevealAmount = Math.max(peekOffset, wordDrag.y, wordDrag.x < 0 ? -wordDrag.x * 0.92 : 0);
  const fuzzyStrength = clamp(wordRevealAmount / WORD_REVEAL_MEANING_THRESHOLD, 0, 1);
  const checkStrength = clamp(rightStrength * (1 - fuzzyStrength), 0, 1);
  const crossStrength = clamp(leftStrength, 0, 1);
  const stackRotation = clamp(stackDrag.x / 18, -12, 12);
  const wordSoloRotation =
    phase === "horizontalDragging" || phase === "leftCommitted" || (phase === "exiting" && wordDrag.x < 0)
      ? clamp(wordDrag.x / 18, -12, 0)
      : 0;
  const answerRotation = clamp(answerDrag.x / 28, -7, 7);
  const answerCorner = isHesitatingRight && (phase === "rightHesitating" || phase === "verticalPeekingFromRight") ? 1 : 0;
  const answerCornerFromTop =
    answerCorner > 0 &&
    Math.abs(stackDrag.x) < RIGHT_HESITATE_START &&
    stackDrag.y > RIGHT_HESITATE_START;
  const answerCornerX = answerCornerFromTop ? 0 : clamp(-stackDrag.x * 0.24, -18, 18) * answerCorner;
  const answerCornerY = answerCornerFromTop ? -18 * answerCorner : 0;
  const answerCornerRotate = answerCornerFromTop ? 0 : (answerCornerX / 18) * 2.8;
  const isPromotingStack =
    (phase === "exiting" && (targetRef.current === "word" || targetRef.current === "answer")) ||
    phase === "dismissPeekedAnswer" ||
    phase === "returningAnswerToStack";
  const isReturningAnswer = phase === "dismissPeekedAnswer" || phase === "returningAnswerToStack";
  const isReturningWord = phase === "returningWordToStack";
  const isDealing = phase === "dealing";

  return (
    <div className={`word-card-wrap text-${settings.cardTextSize}`}>
      <div
        className={`stack-preview ${isDealing ? "is-dealing" : ""} ${isPromotingStack ? "is-promoting" : ""} ${
          isReturningAnswer ? "answer-return-target" : ""
        }`}
        aria-hidden="true"
      >
        {stackWords.slice(0, 6).map((stackWord, index) => (
          <article
            className={`stack-card word-face ${index === 0 ? "next" : ""} ${index >= 5 ? "tail-incoming" : ""}`}
            key={`${stackWord.id}-${index}`}
            style={
              {
                "--stack-layer": index,
                "--stack-count": stackWords.length,
                "--stack-z": stackWords.length - index,
              } as React.CSSProperties
            }
          >
            <FrontWordContent word={stackWord} />
          </article>
        ))}
      </div>

      <div
        className={`card-entry-shell ${isDealing ? "is-dealing" : ""} ${recallEntering ? "recall-entering" : ""} ${
          isReturningAnswer ? "answer-returning-shell" : ""
        }`}
      >
        <div
          className={`active-card-stack ${isDragging && targetRef.current === "word" ? "is-dragging" : ""} ${
            phase === "exiting" && targetRef.current === "word" && stackDrag.x > 0 ? "is-exiting" : ""
          }`}
          style={
            {
              "--stack-x": `${stackDrag.x}px`,
              "--stack-y": `${stackDrag.y}px`,
              "--stack-rotate": `${stackRotation}deg`,
            } as React.CSSProperties
          }
        >
          <article
            className={`answer-card-layer word-face ${phase === "answerActive" ? "active" : ""} ${
              isDragging && targetRef.current === "answer" ? "is-dragging" : ""
            } ${phase === "exiting" && targetRef.current === "answer" ? "is-exiting" : ""} ${
              isReturningAnswer ? "is-returning" : ""
            }`}
            onPointerDown={(event) => phase === "answerActive" && beginDrag(event, "answer")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={
              {
                "--answer-drag-x": `${answerDrag.x}px`,
                "--answer-drag-y": `${answerDrag.y}px`,
                "--answer-rotate": `${answerRotation}deg`,
                "--answer-corner-x": `${answerCornerX}px`,
                "--answer-corner-y": `${answerCornerY}px`,
                "--answer-corner-rotate": `${answerCornerRotate}deg`,
                "--answer-peek-y": `${-peekOffset}px`,
                "--answer-scale": isReturningAnswer ? 0.72 : 1,
              } as React.CSSProperties
            }
          >
            <AnswerContent word={word} settings={settings} />
          </article>

          <article
            className={`word-card-layer word-face ${isDragging && targetRef.current === "word" ? "is-dragging" : ""} ${
              phase === "exiting" && targetRef.current === "word" && wordDrag.x < 0 ? "is-exiting" : ""
            } ${isReturningWord ? "is-returning" : ""} ${wordHidden ? "hidden-behind" : ""}`}
            onClick={handleCardClick}
            onPointerDown={(event) => !wordHidden && beginDrag(event, "word")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={
              {
                "--word-drag-x": `${wordDrag.x}px`,
                "--word-drag-y": `${wordDrag.y}px`,
                "--word-rotate": `${wordSoloRotation}deg`,
                "--word-scale": isReturningWord ? 0.72 : 1,
                "--check-strength": checkStrength,
                "--cross-strength": crossStrength,
                "--fuzzy-strength": fuzzyStrength,
              } as React.CSSProperties
            }
          >
            <div className="corner-mark check-mark top-left">
              <Check size={20} />
            </div>
            <div className="corner-mark check-mark bottom-right">
              <Check size={20} />
            </div>
            <div className="corner-mark cross-mark top-right">
              <X size={20} />
            </div>
            <div className="corner-mark cross-mark bottom-left">
              <X size={20} />
            </div>
            <div className="corner-mark fuzzy-mark top-left">
              <CircleHelp size={20} />
            </div>
            <div className="corner-mark fuzzy-mark bottom-right">
              <CircleHelp size={20} />
            </div>

            {favoritePulse ? (
              <div className="favorite-pulse" aria-hidden="true">
                <BookmarkCheck size={26} />
                <span>{progress.isFavorite ? "已取消" : "已收藏"}</span>
              </div>
            ) : null}

            <div className={`front-word-content ${showExample ? "with-example" : ""}`}>
              <FrontWordContent word={word} interactive settings={settings} />
              {showExample && word.examples.length > 0 ? (
                <button
                  className="front-example"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (settings.tapExamplePronounce) speakText(word.examples[0], settings.accent, settings.speechRate);
                  }}
                >
                  {word.examples[0]}
                </button>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
