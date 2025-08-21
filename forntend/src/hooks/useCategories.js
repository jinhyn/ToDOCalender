import { useState, useEffect } from 'react';
import axios from 'axios';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);

  // 카테고리 목록 불러오기
  const fetchCategories = async () => {
    try {
      // API에서 카테고리 목록 가져오기
      const response = await axios.get('http://localhost:8000/api/categories/');
      setCategories(response.data); // 받은 카테고리 데이터로 상태 설정
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // 태스크 목록 불러오기
  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasks/');
      setTasks(response.data); // 받은 태스크 데이터로 상태 설정
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // 카테고리 추가
  const addCategory = async (name, color) => {
    try {
      await axios.post('http://localhost:8000/api/categories/', { name, color });
      fetchCategories(); // 추가 후 카테고리 목록 다시 불러오기
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // 카테고리 삭제 (해당 카테고리에 속한 태스크들도 삭제)
  const deleteCategory = async (catId) => {
    try {
     
      // 카테고리 삭제
      await axios.delete(`http://localhost:8000/api/categories/${catId}/`);
      console.log('Category deleted successfully');

      // 카테고리 및 태스크 목록 새로고침
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // 카테고리 순서 재정렬
  const reorderCategories = (startIndex, endIndex) => {
    const reordered = Array.from(categories);
    const [removed] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, removed);
    setCategories(reordered);
    // 🟡 서버에 순서 반영은 필요하다면 추가 가능
  };

  useEffect(() => {
    fetchCategories(); // 처음 렌더링 시 카테고리 목록 불러오기
    fetchTasks(); // 태스크 목록도 불러오기
  }, []);

  return { categories, addCategory, deleteCategory, reorderCategories, fetchCategories };
}
