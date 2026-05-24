import { useState } from "react";
import { ArrowLeft, RotateCcw, Settings } from "lucide-react";
import ConfirmDialog from "../components/settings/ConfirmDialog";
import SettingsRow from "../components/settings/SettingsRow";
import SettingsSection from "../components/settings/SettingsSection";
import SettingsSegmented from "../components/settings/SettingsSegmented";
import SettingsStepper from "../components/settings/SettingsStepper";
import SettingsSwitch from "../components/settings/SettingsSwitch";
import { defaultSettings, type AppSettings } from "../models/Settings";
import { clearLearningRecords, loadSettings, saveSettings } from "../storage/localStorage";
import { useNavigate } from "react-router-dom";

type DialogType = "reset" | "clear" | null;

const reviewLimitOptions = [
  { label: "不限制", value: "unlimited" },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
] satisfies { label: string; value: AppSettings["dailyReviewLimit"] }[];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => loadSettings());
  const [dialog, setDialog] = useState<DialogType>(null);
  const [toast, setToast] = useState("");
  const [leaving, setLeaving] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((value) => (value === message ? "" : value)), 1800);
  };

  const goBack = () => {
    setLeaving(true);
    window.setTimeout(() => navigate(-1), 230);
  };

  const resetSettings = () => {
    const next = { ...defaultSettings, selectedBookId: settings.selectedBookId };
    setSettings(next);
    saveSettings(next);
    setDialog(null);
    showToast("设置已恢复默认");
  };

  const clearRecords = () => {
    clearLearningRecords();
    setDialog(null);
    showToast("学习记录已清空");
  };

  return (
    <div className={`settings-page ${leaving ? "is-leaving" : ""}`}>
      <header className="settings-hero">
        <button className="settings-back" type="button" onClick={goBack} aria-label="返回">
          <ArrowLeft size={21} />
        </button>
        <span>
          <Settings size={16} />
          设置
        </span>
        <h1>设置</h1>
        <p>管理学习节奏、发音和卡片显示</p>
      </header>

      <SettingsSection title="学习计划" description="控制每天进入学习队列的节奏。">
        <SettingsRow
          label="每日新词数量"
          description="每天自动加入的新词数量"
          right={<SettingsStepper label="每日新词数量" min={0} max={200} step={5} value={settings.dailyNewCount} onChange={(value) => update("dailyNewCount", value)} />}
        />
        <SettingsRow
          label="每日复习上限"
          description="第一版先保存设置，后续接入复习队列"
          right={
            <SettingsSegmented
              ariaLabel="每日复习上限"
              value={settings.dailyReviewLimit}
              options={reviewLimitOptions}
              onChange={(value) => update("dailyReviewLimit", value)}
            />
          }
        />
        <SettingsRow
          label="优先复习薄弱词"
          description="后续会优先安排 weak 词"
          onClick={() => update("prioritizeWeakWords", !settings.prioritizeWeakWords)}
          right={<SettingsSwitch label="优先复习薄弱词" checked={settings.prioritizeWeakWords} onChange={(value) => update("prioritizeWeakWords", value)} />}
        />
      </SettingsSection>

      <SettingsSection title="复习策略" description="保留轻量算法，预留更细策略。">
        <SettingsRow
          label="复习强度"
          description="影响后续复习队列密度"
          right={
            <SettingsSegmented
              ariaLabel="复习强度"
              value={settings.reviewIntensity}
              options={[
                { label: "轻松", value: "light" },
                { label: "标准", value: "standard" },
                { label: "强化", value: "intense" },
              ]}
              onChange={(value) => update("reviewIntensity", value)}
            />
          }
        />
        <SettingsRow
          label="不会词再次出现"
          description="第一版保存偏好，后续接入调度"
          right={
            <SettingsSegmented
              ariaLabel="不会词再次出现"
              value={settings.wrongWordReappear}
              options={[
                { label: "本轮", value: "laterInSession" },
                { label: "5 分钟", value: "after5min" },
                { label: "明天", value: "tomorrow" },
              ]}
              onChange={(value) => update("wrongWordReappear", value)}
            />
          }
        />
        <SettingsRow label="偷看释义后" description="偷看后仍可划走，但不会记录为会" right={<span className="settings-static-value">记为模糊</span>} />
        <SettingsRow
          label="已掌握词低频复习"
          description="防止 mastered 词长期遗忘"
          onClick={() => update("keepMasteredLowFrequencyReview", !settings.keepMasteredLowFrequencyReview)}
          right={
            <SettingsSwitch
              label="已掌握词低频复习"
              checked={settings.keepMasteredLowFrequencyReview}
              onChange={(value) => update("keepMasteredLowFrequencyReview", value)}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="卡片显示" description="控制释义卡和单词卡的展示内容。">
        <SettingsRow
          label="显示音标"
          onClick={() => update("showPhonetic", !settings.showPhonetic)}
          right={<SettingsSwitch label="显示音标" checked={settings.showPhonetic} onChange={(value) => update("showPhonetic", value)} />}
        />
        <SettingsRow
          label="显示英文释义"
          onClick={() => update("showDefinition", !settings.showDefinition)}
          right={<SettingsSwitch label="显示英文释义" checked={settings.showDefinition} onChange={(value) => update("showDefinition", value)} />}
        />
        <SettingsRow
          label="显示例句"
          onClick={() => update("showExamples", !settings.showExamples)}
          right={<SettingsSwitch label="显示例句" checked={settings.showExamples} onChange={(value) => update("showExamples", value)} />}
        />
        <SettingsRow
          label="显示常见搭配"
          onClick={() => update("showCollocations", !settings.showCollocations)}
          right={<SettingsSwitch label="显示常见搭配" checked={settings.showCollocations} onChange={(value) => update("showCollocations", value)} />}
        />
        <SettingsRow
          label="显示近义词"
          onClick={() => update("showSynonyms", !settings.showSynonyms)}
          right={<SettingsSwitch label="显示近义词" checked={settings.showSynonyms} onChange={(value) => update("showSynonyms", value)} />}
        />
        <SettingsRow
          label="显示记忆提示"
          onClick={() => update("showMemoryHint", !settings.showMemoryHint)}
          right={<SettingsSwitch label="显示记忆提示" checked={settings.showMemoryHint} onChange={(value) => update("showMemoryHint", value)} />}
        />
        <SettingsRow
          label="卡片文字大小"
          right={
            <SettingsSegmented
              ariaLabel="卡片文字大小"
              value={settings.cardTextSize}
              options={[
                { label: "小", value: "small" },
                { label: "标准", value: "standard" },
                { label: "大", value: "large" },
              ]}
              onChange={(value) => update("cardTextSize", value)}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="发音设置" description="控制自动朗读和点击朗读。">
        <SettingsRow
          label="自动发音"
          onClick={() => update("autoPronounce", !settings.autoPronounce)}
          right={<SettingsSwitch label="自动发音" checked={settings.autoPronounce} onChange={(value) => update("autoPronounce", value)} />}
        />
        <SettingsRow
          label="发音口音"
          right={
            <SettingsSegmented
              ariaLabel="发音口音"
              value={settings.accent}
              options={[
                { label: "美音", value: "en-US" },
                { label: "英音", value: "en-GB" },
              ]}
              onChange={(value) => update("accent", value)}
            />
          }
        />
        <SettingsRow
          label="发音速度"
          right={
            <SettingsSegmented
              ariaLabel="发音速度"
              value={settings.speechRate}
              options={[
                { label: "慢", value: 0.85 },
                { label: "标准", value: 1 },
                { label: "快", value: 1.15 },
              ]}
              onChange={(value) => update("speechRate", value)}
            />
          }
        />
        <SettingsRow
          label="点击单词发音"
          onClick={() => update("tapWordPronounce", !settings.tapWordPronounce)}
          right={<SettingsSwitch label="点击单词发音" checked={settings.tapWordPronounce} onChange={(value) => update("tapWordPronounce", value)} />}
        />
        <SettingsRow
          label="点击例句发音"
          onClick={() => update("tapExamplePronounce", !settings.tapExamplePronounce)}
          right={<SettingsSwitch label="点击例句发音" checked={settings.tapExamplePronounce} onChange={(value) => update("tapExamplePronounce", value)} />}
        />
      </SettingsSection>

      <SettingsSection title="操作与动画" description="微调卡片交互的响应方式。">
        <SettingsRow
          label="滑动灵敏度"
          right={
            <SettingsSegmented
              ariaLabel="滑动灵敏度"
              value={settings.swipeSensitivity}
              options={[
                { label: "稳", value: "conservative" },
                { label: "标准", value: "standard" },
                { label: "灵敏", value: "sensitive" },
              ]}
              onChange={(value) => update("swipeSensitivity", value)}
            />
          }
        />
        <SettingsRow
          label="卡片动画强度"
          right={
            <SettingsSegmented
              ariaLabel="卡片动画强度"
              value={settings.cardAnimationStrength}
              options={[
                { label: "柔和", value: "soft" },
                { label: "标准", value: "standard" },
                { label: "明显", value: "strong" },
              ]}
              onChange={(value) => update("cardAnimationStrength", value)}
            />
          }
        />
        <SettingsRow
          label="双击收藏"
          onClick={() => update("doubleTapFavorite", !settings.doubleTapFavorite)}
          right={<SettingsSwitch label="双击收藏" checked={settings.doubleTapFavorite} onChange={(value) => update("doubleTapFavorite", value)} />}
        />
        <SettingsRow
          label="右滑召回条"
          onClick={() => update("rightSwipeRecallBar", !settings.rightSwipeRecallBar)}
          right={<SettingsSwitch label="右滑召回条" checked={settings.rightSwipeRecallBar} onChange={(value) => update("rightSwipeRecallBar", value)} />}
        />
        <SettingsRow
          label="底部手势提示"
          onClick={() => update("bottomGestureHint", !settings.bottomGestureHint)}
          right={<SettingsSwitch label="底部手势提示" checked={settings.bottomGestureHint} onChange={(value) => update("bottomGestureHint", value)} />}
        />
        <SettingsRow
          label="震动反馈"
          description="第一版只保存偏好"
          onClick={() => update("hapticFeedback", !settings.hapticFeedback)}
          right={<SettingsSwitch label="震动反馈" checked={settings.hapticFeedback} onChange={(value) => update("hapticFeedback", value)} />}
        />
      </SettingsSection>

      <SettingsSection title="数据管理" description="这些操作会影响本机数据。">
        <SettingsRow
          label="恢复默认设置"
          description="保留当前词库，不清空学习记录"
          right={
            <button className="settings-inline-action" type="button" onClick={() => setDialog("reset")}>
              恢复
            </button>
          }
        />
        <SettingsRow
          label="清空学习记录"
          description="删除进度、复习日志和学习总结"
          right={
            <button className="settings-danger-action" type="button" onClick={() => setDialog("clear")}>
              <RotateCcw size={15} />
              清空
            </button>
          }
        />
      </SettingsSection>

      {toast ? <div className="settings-toast">{toast}</div> : null}

      {dialog === "reset" ? (
        <ConfirmDialog
          title="恢复默认设置？"
          description="这会把学习计划、发音、显示和操作偏好恢复为默认值，但不会清空学习记录。"
          confirmLabel="确认恢复"
          onCancel={() => setDialog(null)}
          onConfirm={resetSettings}
        />
      ) : null}

      {dialog === "clear" ? (
        <ConfirmDialog
          title="清空学习记录？"
          description="这会删除所有学习进度、复习日志和学习总结，但不会删除词库。"
          confirmLabel="确认清空"
          tone="danger"
          onCancel={() => setDialog(null)}
          onConfirm={clearRecords}
        />
      ) : null}
    </div>
  );
}
