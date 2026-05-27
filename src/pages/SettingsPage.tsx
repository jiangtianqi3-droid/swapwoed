import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, Database, Layers, RotateCcw, Settings, Shuffle, SlidersHorizontal, Volume2 } from "lucide-react";
import ConfirmDialog from "../components/settings/ConfirmDialog";
import SettingsRow from "../components/settings/SettingsRow";
import SettingsSection from "../components/settings/SettingsSection";
import SettingsSegmented from "../components/settings/SettingsSegmented";
import SettingsStepper from "../components/settings/SettingsStepper";
import SettingsSwitch from "../components/settings/SettingsSwitch";
import { defaultSettings, type AppSettings } from "../models/Settings";
import { clearLearningRecords, loadProgressMap, loadSettings, saveSettings } from "../storage/localStorage";
import { clearStudySession } from "../services/studySessionService";
import { getWordBookById, getWordBookMetas, getWordsByBookId } from "../services/wordBookService";
import { useNavigate } from "react-router-dom";

type DialogType = "reset" | "clear" | null;
type Panel = "main" | "books" | "review" | "display" | "speech" | "interaction" | "data";

const reviewLimitOptions = [
  { label: "不限制", value: "unlimited" },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
] satisfies { label: string; value: AppSettings["dailyReviewLimit"] }[];

const panelTitle: Record<Panel, string> = {
  main: "设置",
  books: "单词书",
  review: "复习策略",
  display: "卡片显示",
  speech: "发音设置",
  interaction: "操作与动画",
  data: "数据管理",
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => loadSettings());
  const [progressMap] = useState(() => loadProgressMap());
  const [dialog, setDialog] = useState<DialogType>(null);
  const [toast, setToast] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [panel, setPanel] = useState<Panel>("main");

  const wordBookMetas = getWordBookMetas();
  const selectedBook = getWordBookById(settings.selectedBookId);
  const selectedBookStats = useMemo(() => {
    const wordIds = getWordsByBookId(selectedBook.id).map((word) => word.id);
    const total = wordIds.length;
    const learned = wordIds.filter((id) => progressMap[id] && progressMap[id].status !== "new").length;
    return { total, learned, percent: total ? Math.round((learned / total) * 100) : 0 };
  }, [progressMap, selectedBook]);

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
    if (panel !== "main") {
      setPanel("main");
      return;
    }
    setLeaving(true);
    window.setTimeout(() => navigate(-1), 230);
  };

  const switchBook = (selectedBookId: string) => {
    update("selectedBookId", selectedBookId);
    showToast("将在下一轮学习时生效");
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
    clearStudySession();
    setDialog(null);
    showToast("学习记录已清空");
  };

  const restartCurrentSession = () => {
    clearStudySession();
    showToast("已重新生成本轮学习");
  };

  const menuRight = <ChevronRight size={18} className="settings-chevron" />;

  return (
    <div className={`settings-page ${leaving ? "is-leaving" : ""}`}>
      <header className="settings-hero">
        <button className="settings-back" type="button" onClick={goBack} aria-label="返回">
          <ArrowLeft size={21} />
        </button>
        <span>
          <Settings size={16} />
          {panelTitle[panel]}
        </span>
        <h1>{panelTitle[panel]}</h1>
        <p>{panel === "main" ? "管理学习节奏、词库、发音和卡片显示" : "调整这一组偏好，修改后会立即保存"}</p>
      </header>

      <div className="settings-panel-stack" key={panel}>
      {panel === "main" ? (
        <>
          <SettingsSection title="学习计划" description="当前单词书和每日学习节奏。">
            <button className="settings-book-summary" type="button" onClick={() => setPanel("books")}>
              <span className="settings-book-cover">
                <BookOpen size={24} />
              </span>
              <span className="settings-book-main">
                <strong>{selectedBook.name}</strong>
                <small>{selectedBook.description}</small>
              </span>
              <span className="settings-book-progress">
                <b>{selectedBookStats.learned} / {selectedBookStats.total || "待导入"}</b>
                <i><em style={{ width: `${selectedBookStats.percent}%` }} /></i>
              </span>
            </button>
            <SettingsRow
              label="每日新词数量"
              description="每天自动加入的新词数量"
              right={<SettingsStepper label="每日新词数量" min={0} max={200} step={5} value={settings.dailyNewCount} onChange={(value) => update("dailyNewCount", value)} />}
            />
            <SettingsRow
              label="学习顺序"
              description="只影响下一轮新生成的学习队列"
              right={<SettingsSegmented ariaLabel="学习顺序" value={settings.wordOrder} options={[{ label: "顺序", value: "sequential" }, { label: "乱序", value: "random" }]} onChange={(value) => {
                const next = { ...settings, wordOrder: value, shuffleLearning: value === "random" };
                setSettings(next);
                saveSettings(next);
                showToast("将在下一轮学习时生效");
              }} />}
            />
          </SettingsSection>

          <SettingsSection title="设置分类" description="低频开关已收进二级菜单。">
            <SettingsRow label="单词书" description="四级、六级、考研及更多词库" onClick={() => setPanel("books")} right={menuRight} />
            <SettingsRow label="复习策略" description="复习上限、薄弱词和再次出现规则" onClick={() => setPanel("review")} right={<><span className="settings-menu-icon"><Layers size={17} /></span>{menuRight}</>} />
            <SettingsRow label="卡片显示" description="音标、释义、例句、搭配和文字大小" onClick={() => setPanel("display")} right={menuRight} />
            <SettingsRow label="发音设置" description="口音、速度和点击朗读" onClick={() => setPanel("speech")} right={<><span className="settings-menu-icon"><Volume2 size={17} /></span>{menuRight}</>} />
            <SettingsRow label="操作与动画" description="灵敏度、动画、召回条和手势提示" onClick={() => setPanel("interaction")} right={<><span className="settings-menu-icon"><SlidersHorizontal size={17} /></span>{menuRight}</>} />
            <SettingsRow label="数据管理" description="恢复默认设置或清空学习记录" onClick={() => setPanel("data")} right={<><span className="settings-menu-icon"><Database size={17} /></span>{menuRight}</>} />
          </SettingsSection>
        </>
      ) : null}

      {panel === "books" ? (
        <SettingsSection title="选择单词书" description="内置词库已按四级、六级、考研等分类。">
          <div className="settings-book-list">
            {wordBookMetas.map((book) => {
              const wordIds = getWordsByBookId(book.id).map((word) => word.id);
              const total = wordIds.length;
              const learned = wordIds.filter((id) => progressMap[id] && progressMap[id].status !== "new").length;
              const percent = total ? Math.round((learned / total) * 100) : 0;
              const isActive = book.id === settings.selectedBookId;
              return (
                <button className={`settings-book-option ${isActive ? "active" : ""}`} key={book.id} type="button" onClick={() => book.builtIn && switchBook(book.id)} disabled={!book.builtIn}>
                  <span>
                    <strong>{book.name}</strong>
                    <small>{book.description}</small>
                    <i><em style={{ width: `${percent}%` }} /></i>
                    <small>{total || "即将支持"} 词 · 已学 {learned} · {percent}%</small>
                  </span>
                  {isActive ? <Check size={20} /> : null}
                </button>
              );
            })}
          </div>
        </SettingsSection>
      ) : null}

      {panel === "review" ? (
        <SettingsSection title="复习策略" description="保留轻量算法，预留更细策略。">
          <SettingsRow label="每日复习上限" description="第一版先保存设置，后续接入复习队列" right={<SettingsSegmented ariaLabel="每日复习上限" value={settings.dailyReviewLimit} options={reviewLimitOptions} onChange={(value) => update("dailyReviewLimit", value)} />} />
          <SettingsRow label="优先复习薄弱词" description="后续会优先安排 weak 词" onClick={() => update("prioritizeWeakWords", !settings.prioritizeWeakWords)} right={<SettingsSwitch label="优先复习薄弱词" checked={settings.prioritizeWeakWords} onChange={(value) => update("prioritizeWeakWords", value)} />} />
          <SettingsRow label="复习强度" right={<SettingsSegmented ariaLabel="复习强度" value={settings.reviewIntensity} options={[{ label: "轻松", value: "light" }, { label: "标准", value: "standard" }, { label: "强化", value: "intense" }]} onChange={(value) => update("reviewIntensity", value)} />} />
          <SettingsRow label="不会词再次出现" right={<SettingsSegmented ariaLabel="不会词再次出现" value={settings.wrongWordReappear} options={[{ label: "本轮", value: "laterInSession" }, { label: "5 分钟", value: "after5min" }, { label: "明天", value: "tomorrow" }]} onChange={(value) => update("wrongWordReappear", value)} />} />
          <SettingsRow label="偷看释义后" description="偷看后仍可划走，但不会记录为会" right={<span className="settings-static-value">记为模糊</span>} />
          <SettingsRow label="已掌握词低频复习" onClick={() => update("keepMasteredLowFrequencyReview", !settings.keepMasteredLowFrequencyReview)} right={<SettingsSwitch label="已掌握词低频复习" checked={settings.keepMasteredLowFrequencyReview} onChange={(value) => update("keepMasteredLowFrequencyReview", value)} />} />
        </SettingsSection>
      ) : null}

      {panel === "display" ? (
        <SettingsSection title="卡片显示" description="控制释义卡和单词卡的展示内容。">
          {[
            ["显示音标", "showPhonetic"],
            ["显示英文释义", "showDefinition"],
            ["显示例句", "showExamples"],
            ["显示常见搭配", "showCollocations"],
            ["显示近义词", "showSynonyms"],
            ["显示记忆提示", "showMemoryHint"],
          ].map(([label, key]) => (
            <SettingsRow key={key} label={label} onClick={() => update(key as keyof AppSettings, !settings[key as keyof AppSettings] as never)} right={<SettingsSwitch label={label} checked={Boolean(settings[key as keyof AppSettings])} onChange={(value) => update(key as keyof AppSettings, value as never)} />} />
          ))}
          <SettingsRow label="卡片文字大小" right={<SettingsSegmented ariaLabel="卡片文字大小" value={settings.cardTextSize} options={[{ label: "小", value: "small" }, { label: "标准", value: "standard" }, { label: "大", value: "large" }]} onChange={(value) => update("cardTextSize", value)} />} />
        </SettingsSection>
      ) : null}

      {panel === "speech" ? (
        <SettingsSection title="发音设置" description="控制自动朗读和点击朗读。">
          <SettingsRow label="自动发音" onClick={() => update("autoPronounce", !settings.autoPronounce)} right={<SettingsSwitch label="自动发音" checked={settings.autoPronounce} onChange={(value) => update("autoPronounce", value)} />} />
          <SettingsRow label="发音口音" right={<SettingsSegmented ariaLabel="发音口音" value={settings.accent} options={[{ label: "美音", value: "en-US" }, { label: "英音", value: "en-GB" }]} onChange={(value) => update("accent", value)} />} />
          <SettingsRow label="发音速度" right={<SettingsSegmented ariaLabel="发音速度" value={settings.speechRate} options={[{ label: "慢", value: 0.85 }, { label: "标准", value: 1 }, { label: "快", value: 1.15 }]} onChange={(value) => update("speechRate", value)} />} />
          <SettingsRow label="点击单词发音" onClick={() => update("tapWordPronounce", !settings.tapWordPronounce)} right={<SettingsSwitch label="点击单词发音" checked={settings.tapWordPronounce} onChange={(value) => update("tapWordPronounce", value)} />} />
          <SettingsRow label="点击例句发音" onClick={() => update("tapExamplePronounce", !settings.tapExamplePronounce)} right={<SettingsSwitch label="点击例句发音" checked={settings.tapExamplePronounce} onChange={(value) => update("tapExamplePronounce", value)} />} />
        </SettingsSection>
      ) : null}

      {panel === "interaction" ? (
        <SettingsSection title="操作与动画" description="微调卡片交互的响应方式。">
          <SettingsRow label="滑动灵敏度" right={<SettingsSegmented ariaLabel="滑动灵敏度" value={settings.swipeSensitivity} options={[{ label: "稳", value: "conservative" }, { label: "标准", value: "standard" }, { label: "灵敏", value: "sensitive" }]} onChange={(value) => update("swipeSensitivity", value)} />} />
          <SettingsRow label="卡片动画强度" right={<SettingsSegmented ariaLabel="卡片动画强度" value={settings.cardAnimationStrength} options={[{ label: "柔和", value: "soft" }, { label: "标准", value: "standard" }, { label: "明显", value: "strong" }]} onChange={(value) => update("cardAnimationStrength", value)} />} />
          <SettingsRow label="双击收藏" onClick={() => update("doubleTapFavorite", !settings.doubleTapFavorite)} right={<SettingsSwitch label="双击收藏" checked={settings.doubleTapFavorite} onChange={(value) => update("doubleTapFavorite", value)} />} />
          <SettingsRow label="右滑召回条" onClick={() => update("rightSwipeRecallBar", !settings.rightSwipeRecallBar)} right={<SettingsSwitch label="右滑召回条" checked={settings.rightSwipeRecallBar} onChange={(value) => update("rightSwipeRecallBar", value)} />} />
          <SettingsRow label="底部手势提示" onClick={() => update("bottomGestureHint", !settings.bottomGestureHint)} right={<SettingsSwitch label="底部手势提示" checked={settings.bottomGestureHint} onChange={(value) => update("bottomGestureHint", value)} />} />
          <SettingsRow label="震动反馈" description="第一版只保存偏好" onClick={() => update("hapticFeedback", !settings.hapticFeedback)} right={<SettingsSwitch label="震动反馈" checked={settings.hapticFeedback} onChange={(value) => update("hapticFeedback", value)} />} />
        </SettingsSection>
      ) : null}

      {panel === "data" ? (
        <SettingsSection title="数据管理" description="这些操作会影响本机数据。">
          <SettingsRow label="重新开始本轮学习" description="使用当前设置重新生成牌堆，不清空学习记录" right={<button className="settings-inline-action" type="button" onClick={restartCurrentSession}>重新开始</button>} />
          <SettingsRow label="恢复默认设置" description="保留当前词库，不清空学习记录" right={<button className="settings-inline-action" type="button" onClick={() => setDialog("reset")}>恢复</button>} />
          <SettingsRow label="清空学习记录" description="删除进度、复习日志和学习总结" right={<button className="settings-danger-action" type="button" onClick={() => setDialog("clear")}><RotateCcw size={15} />清空</button>} />
        </SettingsSection>
      ) : null}

      {toast ? <div className="settings-toast">{toast}</div> : null}

      </div>

      {dialog === "reset" ? <ConfirmDialog title="恢复默认设置？" description="这会把学习计划、发音、显示和操作偏好恢复为默认值，但不会清空学习记录。" confirmLabel="确认恢复" onCancel={() => setDialog(null)} onConfirm={resetSettings} /> : null}
      {dialog === "clear" ? <ConfirmDialog title="清空学习记录？" description="这会删除所有学习进度、复习日志和学习总结，但不会删除词库。" confirmLabel="确认清空" tone="danger" onCancel={() => setDialog(null)} onConfirm={clearRecords} /> : null}
    </div>
  );
}
