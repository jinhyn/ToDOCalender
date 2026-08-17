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
  const memoizedCategories = useMemo(() => apiCategories, [apiCategories]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const response = await api.get('categories/');
    setApiCategories(response.data);
  }, [user]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const response = await api.get('tasks/');
    setApiTasks(response.data.map((task) => ({
      ...task,
      tag: task.category_detail?.name || '일반',
      location: typeof task.location === 'string' ? safeParseLocation(task.location) : task.location,
    })));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setApiCategories([]);
      setApiTasks([]);
      setFilterTag('전체');
      return;
    }
    Promise.all([fetchCategories(), fetchTasks()]).catch((error) => console.error('Initial data load failed', error));
  }, [user, fetchCategories, fetchTasks]);

  const reorderCategories = useCallback(async (categories) => {
    const previous = apiCategories;
    setApiCategories(categories);
    try {
      const response = await api.patch('categories/reorder/', {
        orders: categories.map((category) => ({ id: category.id })),
      });
      setApiCategories(response.data);
    } catch (error) {
      setApiCategories(previous);
      throw error;
    }
  }, [apiCategories]);

  const handleEventOperation = useCallback(async (operationInfo, operationType) => {
    const task = operationInfo.event.extendedProps.originalTask;
    const start = operationInfo.event.start;
    const end = operationInfo.event.end;

    if (!task?.id || !start) {
      operationInfo.revert();
      return;
    }

    try {
      await api.patch(`tasks/${task.id}/`, {
        date: start.toISOString(),
        end: end ? end.toISOString() : null,
      });
      await fetchTasks();
    } catch (error) {
      operationInfo.revert();
      console.error(`Calendar ${operationType} failed`, error);
      alert('일정 변경에 실패했습니다. 원래 위치로 되돌렸습니다.');
    }
  }, [fetchTasks]);

  const handleSaveTask = useCallback(async (taskData) => {
    try {
      const isEdit = !!taskData.id;
      const url = isEdit ? `tasks/${taskData.id}/` : 'tasks/';
      const payload = {
        ...taskData,
        category: apiCategories.find((c) => c.name === taskData.tag)?.id || null,
        location: typeof taskData.location === 'object' ? JSON.stringify(taskData.location) : taskData.location,
      };
      if (isEdit) await api.put(url, payload);
      else await api.post(url, payload);
      await fetchTasks();
      setShowPopup(false);
    } catch (error) {
      alert(`저장 실패: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }, [apiCategories, fetchTasks]);

  const handleDeleteTask = useCallback(async (taskId) => {
    if (!taskId || !window.confirm('정말로 삭제하시겠습니까?')) return;
    try {
      await api.delete(`tasks/${taskId}/`);
      await fetchTasks();
      setShowPopup(false);
    } catch (error) {
      console.error('Delete failed', error);
      alert('삭제에 실패했습니다.');
    }
  }, [fetchTasks]);

  const handleDeleteCategory = useCallback(async (categoryId, categoryName) => {
    if (!categoryId) return;
    if (filterTag === categoryName) setFilterTag('전체');
    try {
      await api.delete(`categories/${categoryId}/`);
      await Promise.all([fetchCategories(), fetchTasks()]);
    } catch (error) {
      console.error('Category delete failed', error);
      alert(`카테고리 삭제에 실패했습니다: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  }, [filterTag, fetchCategories, fetchTasks]);

  if (!isKakaoAuthSdkLoaded) return <div>로딩 중...</div>;
  if (!user) return <KakaoAuthDisplay user={null} loginWithKakao={loginWithKakao} logout={logout} />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h1>✅ My Calendar</h1>
        <KakaoAuthDisplay user={user} loginWithKakao={loginWithKakao} logout={logout} />
      </header>
      <main>
        <CategoryManager
          categories={memoizedCategories}
          setFilterTag={setFilterTag}
          currentFilterTag={filterTag}
          reorderCategories={reorderCategories}
          addCategory={async (name, color) => { await api.post('categories/', { name, color }); await fetchCategories(); }}
          deleteCategory={handleDeleteCategory}
        />
        <CalendarDisplay
          tasks={apiTasks}
          categories={memoizedCategories}
          filterTag={filterTag}
          onDateClick={(info) => { setPopupInitialData({ defaultDate: info.dateStr }); setShowPopup(true); }}
          onEventClick={(info) => {
            const task = info.event.extendedProps.originalTask;
            setPopupInitialData({ task, onDelete: handleDeleteTask });
            setShowPopup(true);
          }}
          onEventOperation={handleEventOperation}
        />
      </main>
      {showPopup && <TaskPopup key="task-popup-stable" show={showPopup} onClose={() => setShowPopup(false)} onSave={handleSaveTask} categories={memoizedCategories} initialData={popupInitialData} />}
    </div>
  );
}

function safeParseLocation(value) {
  try { return JSON.parse(value); } catch { return value; }
}
