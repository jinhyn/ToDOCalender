import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';

// 카테고리 텍스트 색상 대비용
const getContrastingTextColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// 카테고리 추가를 위한 함수
const addCategory = async (name, color) => {
  try {
    const response = await axios.post('http://localhost:8000/api/categories/', { name, color });
    if (response.status === 201) {
      return true; // 성공 시 true 반환
    }
    console.error('서버 응답 오류:', response);
    return false;
  } catch (error) {
    console.error('카테고리 추가 실패:', error);
    return false; // 요청 실패 시 false 반환
  }
};

// 카테고리 불러오기 함수
const fetchCategories = async (setApiCategories) => {
  try {
    const response = await axios.get('http://localhost:8000/api/categories/');
    if (response.status === 200) {
      setApiCategories(response.data); // 받아온 카테고리 데이터 설정
    }
  } catch (error) {
    console.error('카테고리 불러오기 실패:', error);
  }
};

// CategoryManager 컴포넌트
export default function CategoryManager({
  categories,
  deleteCategory,
  reorderCategories,
  setFilterTag,
  currentFilterTag
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4A90E2');
  const [apiCategories, setApiCategories] = useState([]); // 상태 추가

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('카테고리 이름이 비어 있습니다.');
      return;
    }

    const categoryExists = categories.some((cat) => cat.name === newCategoryName);
    if (categoryExists) {
      alert('이미 존재하는 카테고리 이름입니다.');
      return;
    }

    try {
      const success = await addCategory(newCategoryName, newCategoryColor); // addCategory 함수 호출
      if (success) {
        console.log('카테고리 추가 성공');
        setNewCategoryName('');
        setNewCategoryColor('#4A90E2');
        // 카테고리 추가 후 카테고리 목록 갱신
        fetchCategories(setApiCategories); // 상태 갱신
      } else {
        alert('카테고리 추가 실패');
      }
    } catch (error) {
      console.error('카테고리 추가 중 에러 발생:', error);
      alert('카테고리 추가 중 문제가 발생했습니다.');
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    reorderCategories(result.source.index, result.destination.index);
  };

  useEffect(() => {
    fetchCategories(setApiCategories); // 컴포넌트 마운트 시 카테고리 불러오기
  }, []); 

  return (
    <>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="새 카테고리 이름"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="color"
          value={newCategoryColor}
          onChange={(e) => setNewCategoryColor(e.target.value)}
          style={{ padding: '0', border: 'none', width: '30px', height: '30px', borderRadius: '4px', cursor: 'pointer' }}
          title="카테고리 색상 선택"
        />
        <button
          onClick={handleAddCategory}
          style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer' }}
        >
          카테고리 추가
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="categories-list" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', paddingBottom: '5px' }}
            >
              {apiCategories.map((cat, index) => (
                <Draggable key={cat.name} draggableId={cat.name} index={index} isDragDisabled={cat.name === '전체'}>
                  {(providedDraggable, snapshot) => (
                    <button
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      {...(cat.name === '전체' ? {} : providedDraggable.dragHandleProps)}
                      onClick={() => setFilterTag(cat.name)}
                      style={{
                        backgroundColor: cat.color,
                        color: getContrastingTextColor(cat.color),
                        borderRadius: '15px',
                        padding: '8px 16px',
                        border: currentFilterTag === cat.name ? `2px solid ${getContrastingTextColor(cat.color)}` : '2px solid transparent',
                        cursor: cat.name === '전체' ? 'pointer' : 'grab',
                        fontSize: '14px',
                        boxShadow: snapshot.isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'box-shadow 0.2s ease, border 0.2s ease',
                        ...providedDraggable.draggableProps.style,
                      }}
                    >
                      {cat.name}
                      {cat.name !== '전체' && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`'${cat.name}' 카테고리를 삭제하시겠습니까?`)) {
                              deleteCategory(cat.name);
                            }
                          }}
                          style={{ marginLeft: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                          title="카테고리 삭제"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
