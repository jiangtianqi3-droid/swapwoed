import type { CSSProperties } from "react";
import type { GestureFeedbackState } from "../models/GestureFeedbackState";
import type { UserWordProgress } from "../models/UserWordProgress";
import { getWordBookProgressStats } from "../services/wordBookService";

type ProgressType = "total" | "known" | "unknown" | "fuzzy";

type StudyProgressMarksProps = {
  bookId: string;
  currentWordId?: string;
  todayCompletedCount: number;
  todayMaxWordCount: number;
  progressMap: Record<string, UserWordProgress>;
  feedback: GestureFeedbackState;
};

type TopProgressBarProps = {
  type: ProgressType;
  progress: number;
  preview: boolean;
  previewProgress: number;
  ariaLabel: string;
};

const CHECK_PATH = "M8 17 L19 27 L40 6";
const QUESTION_PATH = "M20 32 C20 24 28 24 28 15 C28 6 14 6 14 14";
const X_LINE_1 = "M9 9 L31 31";
const X_LINE_2 = "M31 9 L9 31";
const CHECK_LENGTH = 46;
const QUESTION_LENGTH = 42;
const X_LINE_LENGTH = 31;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const isTouched = (progress?: UserWordProgress) =>
  Boolean(
    progress &&
      (progress.status !== "new" ||
        progress.familiarity > 0 ||
        progress.rightCount > 0 ||
        progress.wrongCount > 0 ||
        progress.fuzzyCount > 0 ||
        progress.lastReviewedAt),
  );

const hasState = (progress: UserWordProgress | undefined, type: Exclude<ProgressType, "total">) => {
  if (!progress) return false;
  if (type === "known") return progress.status === "mastered" || (progress.rightCount > 0 && progress.wrongCount === 0 && progress.fuzzyCount === 0 && progress.status !== "weak");
  if (type === "unknown") return progress.status === "weak" || progress.wrongCount > 0;
  return progress.fuzzyCount > 0;
};

function TotalCapsuleProgress({ progress }: { progress: number }) {
  return (
    <div className="top-progress-track">
      <div className="top-progress-fill" style={{ width: `${clamp(progress) * 100}%` }} />
    </div>
  );
}

function KnownCheckProgress({ progress }: { progress: number }) {
  return (
    <svg viewBox="0 0 48 32" className="shape-progress shape-progress--known" aria-hidden="true">
      <path className="shape-progress-track-path" d={CHECK_PATH} pathLength={CHECK_LENGTH} />
      <path
        className="shape-progress-fill-path"
        d={CHECK_PATH}
        pathLength={CHECK_LENGTH}
        style={{ strokeDasharray: CHECK_LENGTH, strokeDashoffset: CHECK_LENGTH * (1 - clamp(progress)) }}
      />
    </svg>
  );
}

function UnknownXProgress({ progress }: { progress: number }) {
  const line1Progress = clamp(progress / 0.5);
  const line2Progress = clamp((progress - 0.5) / 0.5);
  return (
    <svg viewBox="0 0 40 40" className="shape-progress shape-progress--unknown" aria-hidden="true">
      <path className="shape-progress-track-path" d={X_LINE_1} pathLength={X_LINE_LENGTH} />
      <path className="shape-progress-track-path" d={X_LINE_2} pathLength={X_LINE_LENGTH} />
      <path
        className="shape-progress-fill-path"
        d={X_LINE_1}
        pathLength={X_LINE_LENGTH}
        style={{ strokeDasharray: X_LINE_LENGTH, strokeDashoffset: X_LINE_LENGTH * (1 - line1Progress) }}
      />
      <path
        className="shape-progress-fill-path"
        d={X_LINE_2}
        pathLength={X_LINE_LENGTH}
        style={{ strokeDasharray: X_LINE_LENGTH, strokeDashoffset: X_LINE_LENGTH * (1 - line2Progress) }}
      />
    </svg>
  );
}

function FuzzyQuestionProgress({ progress }: { progress: number }) {
  const safeProgress = clamp(progress);
  const dotProgress = clamp(safeProgress / 0.14);
  const curveProgress = clamp((safeProgress - 0.12) / 0.88);
  return (
    <svg viewBox="0 0 40 48" className="shape-progress shape-progress--fuzzy" aria-hidden="true">
      <path className="shape-progress-track-path" d={QUESTION_PATH} pathLength={QUESTION_LENGTH} />
      <path
        className="shape-progress-fill-path"
        d={QUESTION_PATH}
        pathLength={QUESTION_LENGTH}
        style={{ strokeDasharray: QUESTION_LENGTH, strokeDashoffset: QUESTION_LENGTH * (1 - curveProgress) }}
      />
      <circle className="shape-progress-dot-track" cx="20" cy="41" r="2.7" />
      <circle className="shape-progress-dot-fill" cx="20" cy="41" r="2.7" style={{ opacity: dotProgress }} />
    </svg>
  );
}

function TopProgressBar({ type, progress, preview, previewProgress, ariaLabel }: TopProgressBarProps) {
  return (
    <div
      className={`top-progress-card top-progress-card--${type} ${preview ? "is-preview" : ""}`}
      style={
        {
          "--preview-progress": previewProgress,
        } as CSSProperties
      }
      aria-label={ariaLabel}
    >
      {type === "total" ? <TotalCapsuleProgress progress={progress} /> : null}
      {type === "known" ? <KnownCheckProgress progress={progress} /> : null}
      {type === "unknown" ? <UnknownXProgress progress={progress} /> : null}
      {type === "fuzzy" ? <FuzzyQuestionProgress progress={progress} /> : null}
    </div>
  );
}

export default function StudyProgressMarks({
  bookId,
  currentWordId,
  todayCompletedCount,
  todayMaxWordCount,
  progressMap,
  feedback,
}: StudyProgressMarksProps) {
  const stats = getWordBookProgressStats(bookId, progressMap);
  const total = stats.totalWordCount;
  const currentProgress = currentWordId ? progressMap[currentWordId] : undefined;
  const previewType =
    feedback.committed === "fuzzy" || feedback.preview === "peek"
      ? "fuzzy"
      : feedback.committed === "known" || feedback.preview === "known"
        ? "known"
        : feedback.committed === "unknown" || feedback.preview === "unknown"
          ? "unknown"
          : "none";
  const previewStrength = clamp(feedback.committed !== "none" ? 1 : feedback.progress);
  const shouldAddLearned = previewType !== "none" && !isTouched(currentProgress);
  const shouldAddKnown = previewType === "known" && !hasState(currentProgress, "known");
  const shouldAddUnknown = previewType === "unknown" && !hasState(currentProgress, "unknown");
  const shouldAddFuzzy = previewType === "fuzzy" && !hasState(currentProgress, "fuzzy");

  const todayCompleted = Math.min(todayMaxWordCount, todayCompletedCount + (shouldAddLearned ? previewStrength : 0));
  const todayRemaining = Math.max(0, todayMaxWordCount - todayCompleted);
  const knownCount = stats.knownCount + (shouldAddKnown ? previewStrength : 0);
  const unknownCount = stats.unknownCount + (shouldAddUnknown ? previewStrength : 0);
  const fuzzyCount = stats.fuzzyCount + (shouldAddFuzzy ? previewStrength : 0);
  const bookRatio = (count: number) => (total ? count / total : 0);
  const todayRatio = todayMaxWordCount ? todayRemaining / todayMaxWordCount : 0;

  return (
    <div className="top-progress-bars" aria-label="学习进度">
      <TopProgressBar
        type="total"
        progress={todayRatio}
        preview={shouldAddLearned}
        previewProgress={shouldAddLearned ? previewStrength * 0.45 : 0}
        ariaLabel={`今日剩余 ${Math.round(todayRemaining)} / ${todayMaxWordCount}，已完成 ${Math.round(todayCompleted)} / ${todayMaxWordCount}`}
      />
      <TopProgressBar
        type="known"
        progress={bookRatio(knownCount)}
        preview={previewType === "known"}
        previewProgress={previewStrength}
        ariaLabel={`会 ${Math.round(knownCount)} / ${total}`}
      />
      <TopProgressBar
        type="unknown"
        progress={bookRatio(unknownCount)}
        preview={previewType === "unknown"}
        previewProgress={previewStrength}
        ariaLabel={`不会 ${Math.round(unknownCount)} / ${total}`}
      />
      <TopProgressBar
        type="fuzzy"
        progress={bookRatio(fuzzyCount)}
        preview={previewType === "fuzzy"}
        previewProgress={previewStrength}
        ariaLabel={`模糊 ${Math.round(fuzzyCount)} / ${total}`}
      />
    </div>
  );
}
