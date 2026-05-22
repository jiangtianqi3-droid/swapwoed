import { useState } from "react";
import { RotateCcw, Settings } from "lucide-react";
import { clearLearningRecords, loadSettings, saveSettings } from "../storage/localStorage";
import type { AppSettings } from "../models/Settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [cleared, setCleared] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="page">
      <header className="page-header">
        <span>
          <Settings size={18} />
          设置
        </span>
        <h1>学习偏好</h1>
      </header>

      <section className="settings-list">
        <label className="setting-row">
          <span>每日新词数量</span>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.dailyNewCount}
            onChange={(event) => update("dailyNewCount", Number(event.target.value))}
          />
        </label>

        <label className="setting-row">
          <span>自动发音</span>
          <input
            type="checkbox"
            checked={settings.autoPronounce}
            onChange={(event) => update("autoPronounce", event.target.checked)}
          />
        </label>

        <div className="setting-row">
          <span>发音口音</span>
          <div className="segmented">
            <button
              className={settings.accent === "en-US" ? "active" : ""}
              onClick={() => update("accent", "en-US")}
            >
              美音
            </button>
            <button
              className={settings.accent === "en-GB" ? "active" : ""}
              onClick={() => update("accent", "en-GB")}
            >
              英音
            </button>
          </div>
        </div>

        <label className="setting-row">
          <span>显示英文释义</span>
          <input
            type="checkbox"
            checked={settings.showDefinition}
            onChange={(event) => update("showDefinition", event.target.checked)}
          />
        </label>

        <label className="setting-row">
          <span>显示例句</span>
          <input
            type="checkbox"
            checked={settings.showExamples}
            onChange={(event) => update("showExamples", event.target.checked)}
          />
        </label>
      </section>

      <button
        className="danger-action"
        onClick={() => {
          clearLearningRecords();
          setCleared(true);
        }}
      >
        <RotateCcw size={18} />
        清空学习记录
      </button>
      {cleared ? <p className="empty-note">学习记录已清空，刷新统计后会恢复初始状态。</p> : null}
    </div>
  );
}
