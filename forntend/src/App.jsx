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
    try {
      const response = await api.get('categories/');
      setApiCategories(response.data);
    } catch (error) { console.error('Categories load failed', error); }
  }, [user]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    try {
      const response = await api.get('tasks/');
      const processedTasks = response.data.map((task) => ({
        ...task,
        location: typeof task.location === 'string' ? safeParseLocation(task.location) : task.location,
      }));
      setApiTasks(processedTasks);
    } catch (error) { console.error('Tasks load failed', error); }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setApiCategories([]);
      setApiTasks([]);
      return;
    }
    fetchCategories();
    fetchTasks();
  }, [user, fetchCategories, fetchTasks]);

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

  if (!isKakaoAuthSdkLoaded) return <div>로딩 중...</div>;
  if (!user) return <KakaoAuthDisplay user={null} loginWithKakao={loginWithKakao} logout={logout} />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{display: 'flex', justifyContent: 'space-between', marginBottom: '25px'}}>
        <h1>✅ My Calendar</h1>
        <KakaoAuthDisplay user={user} loginWithKakao={loginWithKakao} logout={logout} />
      </header>
      <main>
        <CategoryManager
          categories={memoizedCategories}
          setFilterTag={setFilterTag}
          currentFilterTag={filterTag}
          addCategory={async (name, color) => { await api.post('categories/', { name, color }); await fetchCategories(); }}
          deleteCategory={async (name) => {
            const cat = apiCategories.find((c) => c.name === name);
            if (cat) {
              await api.delete(`categories/${cat.id}/`);
              await fetchCategories();
              await fetchTasks();
              if (filterTag === name) setFilterTag('전체');
            }
          }}
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
        />
      </main>
      {showPopup && <TaskPopup key="task-popup-stable" show={showPopup} onClose={() => setShowPopup(false)} onSave={handleSaveTask} categories={memoizedCategories} initialData={popupInitialData} />}
    </div>
  );
}

function safeParseLocation(value) {
  try { return JSON.parse(value); } catch { return value; }
}
