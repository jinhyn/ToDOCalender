import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
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

  // 데이터 참조 고정 (불필요한 자식 리렌더링 방지)
  const memoizedCategories = useMemo(() => apiCategories, [apiCategories]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/categories/');
      setApiCategories(response.data);
    } catch (error) { console.error('Categories load failed', error); }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasks/');
      const processedTasks = response.data.map(task => ({
        ...task,
        location: typeof task.location === 'string' ? JSON.parse(task.location) : task.location
      }));
      setApiTasks(processedTasks); 
    } catch (error) { console.error('Tasks load failed', error); }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchTasks();
  }, [fetchCategories, fetchTasks]);

  // 일정 저장 로직 (수정/생성 통합)
  const handleSaveTask = useCallback(async (taskData) => {
    try {
      const isEdit = !!taskData.id;
      const url = isEdit ? `http://localhost:8000/api/tasks/${taskData.id}/` : 'http://localhost:8000/api/tasks/';
      const method = isEdit ? 'put' : 'post';

      const payload = {
        ...taskData,
        category: apiCategories.find(c => c.name === taskData.tag)?.id || null,
        location: typeof taskData.location === 'object' ? JSON.stringify(taskData.location) : taskData.location
      };

      await axios[method](url, payload);
      await fetchTasks();
      setShowPopup(false);
    } catch (error) {
      alert("저장 실패: " + JSON.stringify(error.response?.data));
    }
  }, [apiCategories, fetchTasks]);

  // 일정 삭제 로직
  const handleDeleteTask = useCallback(async (taskId) => {
    if (!taskId || !window.confirm("정말로 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/tasks/${taskId}/`);
      await fetchTasks();
      setShowPopup(false);
    } catch (error) { console.error('Delete failed', error); }
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
          addCategory={async (name, color) => {
            await axios.post('http://localhost:8000/api/categories/', { name, color });
            await fetchCategories();
          }}
          deleteCategory={async (name) => {
            const cat = apiCategories.find(c => c.name === name);
            if (cat) {
              await axios.delete(`http://localhost:8000/api/categories/${cat.id}/`);
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
          onDateClick={(info) => {
            setPopupInitialData({ defaultDate: info.dateStr });
            setShowPopup(true);
          }}
          onEventClick={(info) => {
            const task = info.event.extendedProps.originalTask;
            setPopupInitialData({ 
              task, 
              onDelete: (id) => handleDeleteTask(id) 
            });
            setShowPopup(true);
          }}
        />
      </main>

      {showPopup && (
        <TaskPopup
          key="task-popup-stable" 
          show={showPopup}
          onClose={() => setShowPopup(false)}
          onSave={handleSaveTask}
          categories={memoizedCategories}
          initialData={popupInitialData}
        />
      )}
    </div>
  );
}