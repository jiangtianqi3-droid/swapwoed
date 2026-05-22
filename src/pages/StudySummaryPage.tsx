import { Link } from "react-router-dom";
import { ArrowRight, Home, RotateCw } from "lucide-react";
import StatCard from "../components/StatCard";
import { loadLastSummary } from "../storage/localStorage";
import { formatShortTime } from "../utils/dateUtils";

export default function StudySummaryPage() {
  const summary = loadLastSummary();

  if (!summary) {
    return (
      <div className="page study-empty">
        <h1>还没有学习总结</h1>
        <Link className="primary-action" to="/study/today">
          开始学习
          <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="summary-hero">
        <span>本轮完成</span>
        <h1>学习单词：{summary.studiedCount} 个</h1>
        <p>下次复习：{formatShortTime(summary.nextReviewAt)}</p>
      </header>

      <section className="today-grid">
        <StatCard label="右滑会" value={summary.right} tone="green" />
        <StatCard label="左滑不会" value={summary.wrong} tone="red" />
        <StatCard label="新增薄弱词" value={summary.newWeakCount} tone="red" />
      </section>

      <div className="button-row">
        <Link className="secondary-action" to="/">
          <Home size={18} />
          返回首页
        </Link>
        <Link className="primary-action compact" to="/study/weak">
          <RotateCw size={18} />
          再练薄弱词
        </Link>
      </div>
    </div>
  );
}
