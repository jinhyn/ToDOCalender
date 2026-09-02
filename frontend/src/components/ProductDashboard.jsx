import React from 'react';
import './ProductDashboard.css';

export default function ProductDashboard({ tasks, warnings, searchQuery, onSearchChange, notificationsEnabled, onToggleNotifications }) {
  const today = localDateKey(new Date());
  const todayTasks = tasks
    .filter((task) => localDateKey(new Date(task.date)) === today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();
  const nextTask = todayTasks.find((task) => new Date(task.date) > now);
  const upcomingWarnings = warnings.filter((warning) => new Date(warning.next_start) > now);

  return (
    <section className="product-dashboard" aria-label="오늘 일정 요약">
      <div className="product-dashboard-summary">
        <div><span className="product-dashboard-label">오늘 일정</span><strong>{todayTasks.length}개</strong></div>
        <div><span className="product-dashboard-label">이동 확인</span><strong>{upcomingWarnings.length}개</strong></div>
        <div className="product-dashboard-next">
          <span className="product-dashboard-label">다음 일정</span>
          <strong>{nextTask ? `${formatTime(nextTask.date)} ${nextTask.title}` : '오늘 예정 없음'}</strong>
        </div>
      </div>
      <div className="product-dashboard-tools">
        <label className="schedule-search">
          <span aria-hidden="true">⌕</span>
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="일정·장소 검색" aria-label="일정 검색" />
        </label>
        <button type="button" className={`departure-alert-toggle${notificationsEnabled ? ' active' : ''}`} onClick={onToggleNotifications}>
          {notificationsEnabled ? '출발 알림 켜짐' : '출발 알림 켜기'}
        </button>
      </div>
      <p className="product-dashboard-note">출발 알림은 현재 웹앱을 열어둔 동안 권장 출발 시각에 브라우저 알림으로 알려드려요.</p>
    </section>
  );
}

function localDateKey(date) {
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}
