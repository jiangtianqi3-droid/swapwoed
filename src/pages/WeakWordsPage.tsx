import { Link } from "react-router-dom";
import { Flame, PenLine } from "lucide-react";
import { loadProgressMap } from "../storage/localStorage";
import { getWeakWords } from "../services/wordProgressService";

export default function WeakWordsPage() {
  const weakWords = getWeakWords();
  const progressMap = loadProgressMap();

  return (
    <div className="page">
      <header className="page-header">
        <span>
          <Flame size={18} />
          薄弱词
        </span>
        <h1>集中处理最容易忘的词</h1>
      </header>

      <div className="button-row">
        <Link className="primary-action compact" to="/study/weak">
          重新学习
        </Link>
        <button className="secondary-action" type="button" disabled>
          <PenLine size={18} />
          拼写测试
        </button>
      </div>

      <section className="word-list">
        {weakWords.length ? (
          weakWords.map((word) => {
            const progress = progressMap[word.id];
            return (
              <article key={word.id} className="word-row">
                <div>
                  <strong>{word.word}</strong>
                  <span>{word.meaning}</span>
                </div>
                <small>
                  错 {progress.wrongCount} · 模糊 {progress.fuzzyCount}
                </small>
              </article>
            );
          })
        ) : (
          <p className="empty-note">现在还没有薄弱词。先刷一轮，系统会自动把高错词放到这里。</p>
        )}
      </section>
    </div>
  );
}
