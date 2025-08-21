import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import KakaoAuthDisplay from './components/KakaoAuthDisplay';
import CategoryManager from './components/CategoryManager';
import CalendarDisplay from './components/CalendarDisplay';
import TaskPopup from './components/TaskPopup';

import { useKakaoAuth } from './hooks/useKakaoAuth';
import { useCategories } from './hooks/useCategories';
import { useTasks } from './hooks/useTasks';

export default function App() {
  const { user, loginWithKakao, logout, isSdkLoaded: isKakaoAuthSdkLoaded } = useKakaoAuth();
  const { categories, addCategory, deleteCategory, reorderCategories } = useCategories(); 
  const { tasks, addTask: saveTask, deleteTask: removeTask, updateTaskTime, retagTasksForDeletedCategory } = useTasks();

  const [filterTag, setFilterTag] = useState('전체');
  const [showPopup, setShowPopup] = useState(false);
  const [popupInitialData, setPopupInitialData] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);
  const [apiTasks, setApiTasks] = useState([]);

  const calendarRef = useRef(null);

  // API 호출하여 categories와 tasks 데이터 가져오기
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/categories/');
      setApiCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasks/');
      setApiTasks(response.data); 
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  // 최초 렌더링 시 데이터 불러오기
  useEffect(() => {
    fetchCategories();
    fetchTasks();
  }, [fetchCategories, fetchTasks]);

  // 카테고리 추가
  const handleAddCategory = async (name, color) => {
    try {
      await axios.post('http://localhost:8000/api/categories/', { name, color });
      fetchCategories(setApiCategories); // 카테고리 추가 후 목록 갱신
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

const handleDeleteCategory = async (categoryName) => {
  console.log(`Deleting category with name: ${categoryName}`);
  try {
    // 카테고리 목록에서 삭제하려는 카테고리의 id 찾기
    const categoryToDelete = apiCategories.find(category => category.name === categoryName);
    if (!categoryToDelete) {
      console.error("Category not found in the local state");
      return;
    }

    const categoryId = categoryToDelete.id; // 고유 id 추출
    console.log("Category ID:", categoryId);

    // 카테고리 삭제
    await axios.delete(`http://localhost:8000/api/categories/${categoryId}/`);
    console.log("Category deleted successfully");

    // 카테고리 삭제 후 로컬 상태에서 해당 카테고리 제거
    setApiCategories(prevCategories => {
      const updatedCategories = prevCategories.filter(category => category.id !== categoryId);
      fetchCategories(); // 카테고리 삭제 후 fetchCategories()를 호출하여 데이터 갱신
      return updatedCategories; // 최신 카테고리 목록으로 상태 업데이트
    });

    // 태스크 목록도 새로고침 (카테고리 삭제로 인한 영향 반영)
    fetchTasks(); 
    fetchCategories(setApiCategories);
  } catch (error) {
    console.error("Error deleting category:", error.response ? error.response.data : error.message);
  }
};




  // 태스크 추가 및 수정
  const handleSaveTask = useCallback(async (taskData, editIndex) => {
    try {
      const url = editIndex !== null && taskData.id
        ? `http://localhost:8000/api/tasks/${taskData.id}/`
        : 'http://localhost:8000/api/tasks/';
      
      const method = editIndex !== null && taskData.id ? 'put' : 'post';

      await axios[method](url, taskData);
      fetchTasks(); // 태스크 추가/수정 후 다시 불러오기
      setShowPopup(false); // 팝업 닫기
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }, [fetchTasks]);

  // 태스크 삭제
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      await axios.delete(`http://localhost:8000/api/tasks/${taskId}/`);
      fetchTasks(); // 태스크 삭제 후 다시 불러오기
      setShowPopup(false); // 팝업 닫기
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [fetchTasks]);

  // 태스크 시간 업데이트
  const handleEventOperation = useCallback(async (info) => {
    const { event } = info;
    const originalTaskData = event.extendedProps.originalTask;

    if (!originalTaskData) {
      console.error("Original task data missing from event. Cannot update.", event);
      info.revert();
      alert("오류: 일정의 원본 데이터를 찾을 수 없어 업데이트할 수 없습니다.");
      return;
    }

    const newStart = event.startStr;
    let newEnd = event.endStr;

    if (!newEnd) { 
      newEnd = newStart;
    }

    try {
      await updateTaskTime(originalTaskData.title, originalTaskData.date, newStart, newEnd);
      fetchTasks(); // 태스크 시간 업데이트 후 다시 불러오기
    } catch (error) {
      console.error('Error updating task time:', error);
      info.revert();
    }
  }, [updateTaskTime]);

  const handleDateClick = useCallback((dateInfo) => {
    setPopupInitialData({ defaultDate: dateInfo.dateStr });
    setShowPopup(true);
  }, []);

  const handleEventClick = useCallback((clickInfo) => {
    const clickedEventOriginalTask = clickInfo.event.extendedProps.originalTask;
    if (!clickedEventOriginalTask) {
      console.warn("Original task data not found in event's extendedProps", clickInfo.event);
      return;
    }

    const taskIndex = tasks.findIndex(
      (t) => t.title === clickedEventOriginalTask.title && t.date === clickedEventOriginalTask.date && t.end === clickedEventOriginalTask.end
    );

    if (taskIndex >= 0) {
      setPopupInitialData({ task: tasks[taskIndex], index: taskIndex, onDelete: handleDeleteTask });
      setShowPopup(true);
    } else {
      console.warn("Task for event click not found in state. Event:", clickInfo.event, "Original Task:", clickedEventOriginalTask);
      alert("선택한 일정 정보를 현재 목록에서 찾을 수 없습니다.");
    }
  }, [tasks, handleDeleteTask]);

  if (!isKakaoAuthSdkLoaded) {
    return <div style={{textAlign: 'center', marginTop: '50px', fontSize: '18px'}}>앱 초기화 중...</div>;
  }

  if (!user) {
    return <KakaoAuthDisplay user={null} loginWithKakao={loginWithKakao} logout={logout} />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #eee'}}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>✅ To-Do Calendar</h1>
        <KakaoAuthDisplay user={user} loginWithKakao={loginWithKakao} logout={logout} />
      </header>

      <main>
        <CategoryManager
          categories={apiCategories}
          addCategory={handleAddCategory}
          deleteCategory={handleDeleteCategory}
          reorderCategories={reorderCategories}
          setFilterTag={setFilterTag}
          currentFilterTag={filterTag}
          setCategories={setApiCategories} 
        />
        
        <CalendarDisplay
          ref={calendarRef}
          tasks={apiTasks}
          categories={apiCategories}
          filterTag={filterTag}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onEventOperation={handleEventOperation}
        />
      </main>

      {showPopup && (
        <TaskPopup
          show={showPopup}
          onClose={() => {
            setShowPopup(false);
            setPopupInitialData(null);
          }}
          onSave={handleSaveTask}
          categories={apiCategories}
          initialData={popupInitialData}
        />
      )}
    </div>
  );
}
