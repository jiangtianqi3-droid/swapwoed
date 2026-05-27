import { useState } from "react";
import { BookOpen, Check } from "lucide-react";
import { loadProgressMap, loadSettings, saveSettings } from "../storage/localStorage";
import { getWordBookMetas, getWordsByBookId } from "../services/wordBookService";

export default function WordBookPage() {
  const [settings, setSettings] = useState(() => loadSettings());
  const progressMap = loadProgressMap();
  const wordBooks = getWordBookMetas();

  const updateDailyNewCount = (dailyNewCount: number) => {
    const next = { ...settings, dailyNewCount };
    setSettings(next);
    saveSettings(next);
  };

  const switchBook = (selectedBookId: string) => {
    const next = { ...settings, selectedBookId };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="page">
      <header className="page-header">
        <span>
          <BookOpen size={18} />
          词库
        </span>
        <h1>选择今天要刷的词</h1>
      </header>

      <section className="setting-panel">
        <label htmlFor="daily-new">每日新词数量</label>
        <input
          id="daily-new"
          type="number"
          min={1}
          max={100}
          value={settings.dailyNewCount}
          onChange={(event) => updateDailyNewCount(Number(event.target.value))}
        />
      </section>

      <section className="book-list">
        {wordBooks.map((book) => {
          const wordIds = getWordsByBookId(book.id).map((word) => word.id);
          const mastered = wordIds.filter((id) => progressMap[id]?.status === "mastered").length;
          const percent = wordIds.length ? Math.round((mastered / wordIds.length) * 100) : 0;
          const isActive = book.id === settings.selectedBookId;

          return (
            <button
              key={book.id}
              className={`book-item ${isActive ? "active" : ""}`}
              onClick={() => switchBook(book.id)}
              disabled={!book.builtIn}
            >
              <div>
                <strong>{book.name}</strong>
                <span>{book.description}</span>
                <div className="progress-line">
                  <i style={{ width: `${percent}%` }} />
                </div>
                <small>
                  {wordIds.length || "即将支持"} 词 · 当前进度 {percent}%
                </small>
              </div>
              {isActive ? <Check size={22} /> : null}
            </button>
          );
        })}
      </section>
    </div>
  );
}
