import { useState, useEffect, useCallback } from 'react';

export const useTasks = () => {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((taskData, editIndex) => {
    setTasks(prevTasks => {
      if (editIndex !== null && editIndex !== undefined && prevTasks[editIndex]) {
        const newTasks = [...prevTasks];
        newTasks[editIndex] = taskData;
        return newTasks;
      } else {
        return [...prevTasks, taskData];
      }
    });
  }, []);

  const deleteTask = useCallback((index) => {
    setTasks(prevTasks => prevTasks.filter((_, i) => i !== index));
  }, []);

  const updateTaskTime = useCallback((originalTitle, originalDate, newStart, newEnd) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.title === originalTitle && task.date === originalDate
          ? { ...task, date: newStart, end: newEnd }
          : task
      )
    );
  }, []);

  // ✨ 새 함수: 카테고리 삭제 시 태스크의 태그를 변경
  const retagTasksForDeletedCategory = useCallback((deletedCategoryName, defaultCategoryName) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.tag === deletedCategoryName ? { ...task, tag: defaultCategoryName || '' } : task
      )
    );
  }, []);

  return {
    tasks,
    addTask,
    deleteTask,
    updateTaskTime,
    retagTasksForDeletedCategory, // ✨ 새로운 함수를 반환합니다
  };
};