import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from './services/axios';
import KakaoAuthDisplay from './components/KakaoAuthDisplay';
import CategoryManager from './components/CategoryManager';
import CalendarDisplay from './components/CalendarDisplay';
import TaskPopup from './components/TaskPopup';
import { useKakaoAuth } from './hooks/useKakaoAuth';

export default function App() {
  const { user, accessToken, loginWithKakao, logout, isSdkLoaded: isKakaoAuthSdkLoaded } = useKakaoAuth();
  const [filterTag, setFilterTag] = useState('전체');

  // 카카오 로그인 토큰을 api 인스턴스의 모든 요청 Authorization 헤더로 실어 보냄.
  // 백엔드는 이 토큰을 카카오 서버에 검증한 뒤에만 API 접근을 허용합니다.
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupInitialData, setPopupInitialData] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiTasks, setApiTasks] = useState([]);

  // 데이터 참조 고정 (불필요한 자식 리렌더링 방지)
  const memoizedCategories = useMemo(() => apiCategories, [apiCategories]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('categories/');
      setApiCategories(response.data);
    } catch (error) { console.error('Categories load failed', error); }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await api.get('tasks/');
      const processedTasks = response.data.map(task => ({
        ...task,
        location: typeof task.location === 'string' ? JSON.parse(task.location) : task.location
      }));
      setApiTasks(processedTasks); 
    } catch (error) { console.error('Tasks load failed', error); }
  }, []);

  useEffect(() => {
    // accessToken이 준비되기 전엔 호출해도 401만 나므로, 로그인 완료 후에만 불러옵니다.
    if (!accessToken) return;
    fetchCategories();
    fetchTasks();
  }, [fetchCategories, fetchTasks, accessToken]);

  // 일정 저장 로직 (수정/생성 통합)
  const handleSaveTask = useCallback(async (taskData) => {
    try {
      const isEdit = !!taskData.id;
      const url = isEdit ? `tasks/${taskData.id}/` : 'tasks/';
      const method = isEdit ? 'put' : 'post';

      const payload = {
        ...taskData,
        category: apiCategories.find(c => c.name === taskData.tag)?.id || null,
        location: typeof taskData.location === 'object' ? JSON.stringify(taskData.location) : taskData.location
      };

      await api[method](url, payload);
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
      await api.delete(`tasks/${taskId}/`);
      await fetchTasks();
      setShowPopup(false);
    } catch (error) { console.error('Delete failed', error); }
  }, [fetchTasks]);

  // 카테고리 드래그 앤 드롭 순서 저장
  // 화면은 즉시(낙관적으로) 새 순서로 갱신하고, 서버 저장이 실패하면 원래 순서로 되돌립니다.
  const handleReorderCategories = useCallback(async (orderedIds) => {
    const previousCategories = apiCategories;
    const reordered = orderedIds
      .map((id) => apiCategories.find((c) => c.id === id))
      .filter(Boolean);
    setApiCategories(reordered);

    try {
      await api.post('categories/reorder/', { order: orderedIds });
    } catch (error) {
      console.error('Category reorder failed', error);
      setApiCategories(previousCategories); // 롤백
      alert('카테고리 순서를 저장하지 못했습니다. 다시 시도해주세요.');
    }
  }, [apiCategories]);

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
            await api.post('categories/', { name, color });
            await fetchCategories();
          }}
          deleteCategory={async (name) => {
            const cat = apiCategories.find(c => c.name === name);
            if (cat) {
              await api.delete(`categories/${cat.id}/`);
              await fetchCategories();
              await fetchTasks();
              if (filterTag === name) setFilterTag('전체');
            }
          }}
          reorderCategories={handleReorderCategories}
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
