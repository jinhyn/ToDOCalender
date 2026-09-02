import React, { useRef, useState } from 'react';
import api from '../services/axios';
import './ProductDashboard.css';

export default function ProductDashboard({ tasks, plans = [], warnings, searchQuery, onSearchChange, notificationsEnabled, onToggleNotifications, onRefresh, onDeleteAccount }) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const today = localDateKey(new Date());
  const todayTasks = tasks
    .filter((task) => localDateKey(new Date(task.date)) === today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();
  const nextTask = todayTasks.find((task) => new Date(task.date) > now);
  const upcomingWarnings = warnings.filter((warning) => new Date(warning.next_start) > now);
  const nextDeparture = plans
    .filter((plan) => plan.reason === 'travel_time' && plan.recommended_departure_at && new Date(plan.recommended_departure_at) > now)
    .sort((a, b) => new Date(a.recommended_departure_at) - new Date(b.recommended_departure_at))[0];

  const importCalendar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const events = parseIcs(text).slice(0, 100);
      if (!events.length) throw new Error('가져올 일정을 찾지 못했습니다.');
      await api.post('tasks/bulk/', { tasks: events });
      if (onRefresh) await onRefresh();
      alert(`${events.length}개의 일정을 가져왔습니다. 장소 좌표가 없는 일정은 필요할 때 장소를 다시 선택해주세요.`);
      if (!onRefresh) window.location.reload();
    } catch (error) {
      const detail = error.response?.data?.errors || error.response?.data?.tasks;
      alert(detail ? `가져오기 실패: ${JSON.stringify(detail)}` : (error.message || '캘린더 파일을 가져오지 못했습니다.'));
    } finally {
      setIsImporting(false);
    }
  };

  const deleteAccountData = async () => {
    if (onDeleteAccount) return onDeleteAccount();
    if (!window.confirm('ToDOCalender에 저장한 일정, 카테고리, 즐겨찾는 장소가 모두 삭제됩니다. 계속할까요?')) return;
    if (!window.confirm('삭제한 앱 데이터는 복구할 수 없습니다. 정말 삭제할까요?')) return;
    try {
      await api.delete('account/');
      localStorage.removeItem('todo-calendar-departure-alerts');
      const reload = () => window.location.reload();
      if (window.Kakao?.Auth?.logout) {
        try {
          const result = window.Kakao.Auth.logout(reload);
          if (result?.then) result.finally(reload);
          else window.setTimeout(reload, 800);
        } catch {
          reload();
        }
      } else {
        reload();
      }
    } catch {
      alert('앱 데이터를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <section className="product-dashboard" aria-label="오늘 일정 요약">
      <div className="product-dashboard-summary">
        <div><span className="product-dashboard-label">오늘 일정</span><strong>{todayTasks.length}개</strong></div>
        <div><span className="product-dashboard-label">이동 경고</span><strong>{upcomingWarnings.length}개</strong></div>
        <div className="product-dashboard-next">
          <span className="product-dashboard-label">다음 일정</span>
          <strong>{nextTask ? `${formatTime(nextTask.date)} ${nextTask.title}` : '오늘 예정 없음'}</strong>
        </div>
        <div className="product-dashboard-departure">
          <span className="product-dashboard-label">다음 권장 출발</span>
          <strong>{nextDeparture ? `${formatDateTime(nextDeparture.recommended_departure_at)} · ${nextDeparture.next_title}` : '예정 없음'}</strong>
          {nextDeparture && <small>예상 이동 {formatDuration(nextDeparture.travel_seconds)}</small>}
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
      <div className="product-dashboard-actions">
        <button type="button" onClick={() => exportIcs(tasks)}>ICS 내보내기</button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>{isImporting ? '가져오는 중…' : 'ICS 가져오기'}</button>
        <button type="button" className="data-delete-action" onClick={deleteAccountData}>내 앱 데이터 삭제</button>
        <input ref={fileInputRef} type="file" accept=".ics,text/calendar" hidden onChange={importCalendar} />
      </div>
      <p className="product-dashboard-note">권장 출발은 앞으로 7일 안의 연속 일정 중 장소가 다른 경우 계산해요. 출발 알림은 현재 웹앱을 열어둔 동안 권장 출발 시각에 브라우저 알림으로 알려드려요. Google·Apple·Outlook 캘린더는 ICS 파일로 가져오거나 내보낼 수 있어요.</p>
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

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(seconds) {
  const minutes = Math.max(0, Math.ceil((seconds || 0) / 60));
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

function exportIcs(tasks) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ToDOCalender//KO', 'CALSCALE:GREGORIAN'];
  tasks.forEach((task) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:todo-calendar-${task.id}@local`);
    lines.push(`DTSTAMP:${toIcsDate(new Date())}`);
    lines.push(`DTSTART:${toIcsDate(new Date(task.date))}`);
    if (task.end) lines.push(`DTEND:${toIcsDate(new Date(task.end))}`);
    lines.push(`SUMMARY:${escapeIcs(task.title || '일정')}`);
    if (task.locationName) lines.push(`LOCATION:${escapeIcs(task.locationName)}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `todo-calendar-${localDateKey(new Date())}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseIcs(text) {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  return unfolded.split('BEGIN:VEVENT').slice(1).map((chunk) => {
    const block = chunk.split('END:VEVENT')[0] || '';
    const values = Object.fromEntries(block.split(/\r?\n/).map((line) => {
      const index = line.indexOf(':');
      if (index < 0) return ['', ''];
      return [line.slice(0, index).split(';')[0], line.slice(index + 1)];
    }).filter(([key]) => key));
    const start = parseIcsDate(values.DTSTART);
    if (!start) return null;
    const end = parseIcsDate(values.DTEND);
    return {
      title: unescapeIcs(values.SUMMARY || '가져온 일정'),
      date: start,
      end: end || start,
      category: null,
      location: null,
      location_name: unescapeIcs(values.LOCATION || ''),
    };
  }).filter(Boolean);
}

function parseIcsDate(value) {
  if (!value) return null;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
  if (!match) return null;
  const [, year, month, day, hour = '00', minute = '00', second = '00', utc] = match;
  const date = utc
    ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
    : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
function escapeIcs(value) { return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function unescapeIcs(value) { return String(value).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\'); }
