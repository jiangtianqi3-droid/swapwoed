import { BarChart3 } from "lucide-react";
import ProgressRing from "../components/ProgressRing";
import StatCard from "../components/StatCard";
import { getStatistics } from "../services/statisticsService";

export default function StatisticsPage() {
  const stats = getStatistics();

  return (
    <div className="page">
      <header className="page-header">
        <span>
          <BarChart3 size={18} />
          统计
        </span>
        <h1>你的记忆状态</h1>
      </header>

      <section className="stats-overview">
        <ProgressRing value={stats.todayCompletionRate} label="今日完成" />
        <ProgressRing value={stats.reviewCompletionRate} label="复习完成" />
      </section>

      <section className="today-grid">
        <StatCard label="连续学习天数" value={`${stats.streak} 天`} tone="green" />
        <StatCard label="总掌握词数" value={stats.masteredCount} tone="blue" />
        <StatCard label="薄弱词数量" value={stats.weakCount} tone="red" />
      </section>

      <section className="panel">
        <h2>最近最容易忘</h2>
        {stats.forgettableWords.length ? (
          stats.forgettableWords.map(({ word, progress }) =>
            word ? (
              <div className="mini-row" key={word.id}>
                <span>{word.word}</span>
                <strong>错 {progress.wrongCount} · 模糊 {progress.fuzzyCount}</strong>
              </div>
            ) : null,
          )
        ) : (
          <p className="empty-note">暂无高频遗忘词。</p>
        )}
      </section>
    </div>
  );
}
