import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import ProgressRing from "../components/ProgressRing";
import StatCard from "../components/StatCard";
import { getStatistics } from "../services/statisticsService";
import { formatToday } from "../utils/dateUtils";

export default function HomePage() {
  const stats = getStatistics();

  return (
    <div className="page">
      <header className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">
            <CalendarDays size={16} />
            {formatToday()}
          </span>
          <h1>像刷卡片一样背单词</h1>
          <p>刷一下，记一个。今天从 {stats.selectedBook.name} 开始。</p>
        </div>
        <ProgressRing value={stats.todayCompletionRate} label="今日进度" />
      </header>

      <section className="today-grid" aria-label="今日任务">
        <StatCard label="今日新词" value={stats.todayNewCount} tone="blue" helper="按当前设置加入" />
        <StatCard label="今日复习" value={stats.dueReviewCount} tone="yellow" helper="到期卡片" />
        <StatCard label="薄弱词" value={stats.weakCount} tone="red" helper="需要重点看" />
      </section>

      <Link className="primary-action" to="/study/today">
        <Sparkles size={20} />
        开始今日学习
        <ArrowRight size={20} />
      </Link>

      <section className="summary-band">
        <div>
          <span>连续学习</span>
          <strong>{stats.streak} 天</strong>
        </div>
        <div>
          <span>总掌握词数</span>
          <strong>{stats.masteredCount}</strong>
        </div>
        <div>
          <span>总词库进度</span>
          <strong>{stats.progressPercent}%</strong>
        </div>
      </section>
    </div>
  );
}
