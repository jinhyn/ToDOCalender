import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from './services/axios';
import KakaoAuthDisplay from './components/KakaoAuthDisplay';
import CategoryManager from './components/CategoryManager';
import CalendarDisplay from './components/CalendarDisplay';
import TaskPopup from './components/TaskPopup';
import { useKakaoAuth } from './hooks/useKakaoAuth';

export default function App() {
  const { user, loginWithKakao, logout, isSdkLoaded: isKakaoAuthSdkLoaded } = useKakaoAuth();
  const [filterTag, setFilterTag] = useState('전체');
  const [showPopup, setShowPopup] = useState(false);
  const [popupInitialData, setPopupInitialData] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiTasks, setApiTasks] = useState([]);
  const [travelWarnings, setTravelWarnings] = useState([]);
  const memoizedCategories = useMemo(() => apiCategories, [apiCategories]);

  const fetchCategories = useCallback(async () => { if (!user) return; const response = await api.get('categories/'); setApiCategories(response.data); }, [user]);
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const response = await api.get('tasks/');
    setApiTasks(response.data.map((task) => ({ ...task, tag: task.category_detail?.name || '일반', location: typeof task.location === 'string' ? safeParseLocation(task.location) : task.location, locationName: task.location_name || '' })));
  }, [user]);
  const fetchTravelWarnings = useCallback(async () => {
    if (!user) return;
    try { const response = await api.get('tasks/travel-warnings/'); setTravelWarnings(response.data?.warnings || []); }
    catch (error) { console.warn('Travel warning check failed', error); setTravelWarnings([]); }
  }, [user]);
  useEffect(() => { if (!user) { setApiCategories([]); setApiTasks([]); setTravelWarnings([]); setFilterTag('전체'); return; } Promise.all([fetchCategories(), fetchTasks()]).catch((error) => console.error('Initial data load failed', error)); }, [user, fetchCategories, fetchTasks]);
  useEffect(() => { if (user && apiTasks.length >= 2) fetchTravelWarnings(); else setTravelWarnings([]); }, [user, apiTasks, fetchTravelWarnings]);

  const reorderCategories = useCallback(async (categories) => {
    const previous = apiCategories; setApiCategories(categories);
    try { const response = await api.patch('categories/reorder/', { orders: categories.map((category) => ({ id: category.id })) }); setApiCategories(response.data); }
    catch (error) { setApiCategories(previous); throw error; }
  }, [apiCategories]);
  const handleEventOperation = useCallback(async (operationInfo, operationType) => {
    const task = operationInfo.event.extendedProps.originalTask; const start = operationInfo.event.start; const end = operationInfo.event.end;
    if (!task?.id || !start) { operationInfo.revert(); return; }
    try { await api.patch(`tasks/${task.id}/`, { date: start.toISOString(), end: end ? end.toISOString() : null }); await fetchTasks(); }
    catch (error) { operationInfo.revert(); console.error(`Calendar ${operationType} failed`, error); alert('일정 변경에 실패했습니다. 원래 위치로 되돌렸습니다.'); }
  }, [fetchTasks]);
  const handleSaveTask = useCallback(async (taskData) => {
    try {
      const isEdit = !!taskData.id; const url = isEdit ? `tasks/${taskData.id}/` : 'tasks/';
      const payload = { title: taskData.title, date: taskData.date, end: taskData.end, category: apiCategories.find((c) => c.name === taskData.tag)?.id || null, location: typeof taskData.location === 'object' ? JSON.stringify(taskData.location) : taskData.location, location_name: taskData.locationName || '' };
      if (isEdit) await api.put(url, payload); else await api.post(url, payload); await fetchTasks(); setShowPopup(false);
    } catch (error) { alert(`저장 실패: ${JSON.stringify(error.response?.data || error.message)}`); }
  }, [apiCategories, fetchTasks]);
  const handleDeleteTask = useCallback(async (taskId) => {
    if (!taskId || !window.confirm('정말로 삭제하시겠습니까?')) return;
    try { await api.delete(`tasks/${taskId}/`); await fetchTasks(); setShowPopup(false); } catch (error) { console.error('Delete failed', error); alert('삭제에 실패했습니다.'); }
  }, [fetchTasks]);
  const handleDeleteCategory = useCallback(async (categoryId, categoryName) => {
    if (!categoryId) return; if (filterTag === categoryName) setFilterTag('전체');
    try { await api.delete(`categories/${categoryId}/`); await Promise.all([fetchCategories(), fetchTasks()]); } catch (error) { console.error('Category delete failed', error); alert(`카테고리 삭제에 실패했습니다: ${JSON.stringify(error.response?.data || error.message)}`); }
  }, [filterTag, fetchCategories, fetchTasks]);

  const warningByNextTaskId = useMemo(() => Object.fromEntries(travelWarnings.map((warning) => [warning.next_task_id, warning])), [travelWarnings]);
  if (!isKakaoAuthSdkLoaded) return <div className="app-loading"><div className="loading-orb">✓</div><span>캘린더를 준비하고 있어요...</span></div>;
  if (!user) return <KakaoAuthDisplay user={null} loginWithKakao={loginWithKakao} logout={logout} />;

  return (
    <div className="app-shell">
      <header className="app-header"><div className="app-header-inner">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true">✓</div><div><div className="brand-eyebrow">TO DO CALENDAR</div><h1>나의 일정</h1></div></div>
        <KakaoAuthDisplay user={user} logout={logout} loginWithKakao={loginWithKakao} />
      </div></header>
      <main className="app-main">
        <section className="welcome-strip"><div><span className="welcome-kicker">오늘의 계획</span><h2>차근차근, 하나씩 해볼까요?</h2><p>일정을 정리하고 이동 시간까지 미리 확인해보세요.</p></div><div className="welcome-sun" aria-hidden="true">✦</div></section>
        <section className="category-section"><div className="section-heading"><div><h2>카테고리</h2><p>드래그해서 순서를 바꿀 수 있어요</p></div><span className="section-badge">MY LIST</span></div>
          <CategoryManager categories={memoizedCategories} setFilterTag={setFilterTag} currentFilterTag={filterTag} reorderCategories={reorderCategories} addCategory={async (name, color) => { await api.post('categories/', { name, color }); await fetchCategories(); }} deleteCategory={handleDeleteCategory} />
        </section>
        {travelWarnings.length > 0 && <section className="travel-warning-panel" aria-label="이동시간 경고"><div className="travel-warning-heading"><span className="travel-warning-icon">!</span><div><strong>이동시간을 조금 확인해주세요</strong><div className="travel-warning-subtitle">다음 일정까지 이동할 시간이 충분하지 않은 일정이 있어요.</div></div></div><div className="travel-warning-list">{travelWarnings.slice(0, 3).map((warning) => <div className="travel-warning-item" key={`${warning.previous_task_id}-${warning.next_task_id}`}><div><strong>{warning.previous_title}</strong><span className="warning-arrow">→</span><strong>{warning.next_title}</strong></div>{warning.reason === 'overlap' ? <span>일정 시간이 겹칩니다.</span> : <span>이동 예상 {formatDuration(warning.travel_seconds)} · 이동 가능 {formatDuration(warning.available_seconds)} · <b>{formatDuration(warning.deficit_seconds)} 부족</b></span>}</div>)}</div></section>}
        <section className="calendar-card"><CalendarDisplay tasks={apiTasks} categories={memoizedCategories} filterTag={filterTag} travelWarnings={warningByNextTaskId}
          onDateClick={(info) => { setPopupInitialData({ defaultDate: info.dateStr }); setShowPopup(true); }}
          onEventClick={(info) => { const task = info.event.extendedProps.originalTask; setPopupInitialData({ task, onDelete: handleDeleteTask, travelWarning: warningByNextTaskId[task.id] }); setShowPopup(true); }} onEventOperation={handleEventOperation} /></section>
      </main>
      {showPopup && <TaskPopup key="task-popup-stable" show={showPopup} onClose={() => setShowPopup(false)} onSave={handleSaveTask} categories={memoizedCategories} initialData={popupInitialData} />}
    </div>
  );
}
function formatDuration(seconds) { const minutes = Math.max(0, Math.ceil((seconds || 0) / 60)); if (minutes < 60) return `${minutes}분`; const hours = Math.floor(minutes / 60); const rest = minutes % 60; return rest ? `${hours}시간 ${rest}분` : `${hours}시간`; }
function safeParseLocation(value) { try { return JSON.parse(value); } catch { return value; } }
