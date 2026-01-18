import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const getContrastingTextColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export default function CategoryManager({
  categories,
  addCategory,
  deleteCategory,
  setFilterTag,
  currentFilterTag
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4A90E2');

  const handleAddClick = async () => {
    if (!newCategoryName.trim()) return alert('이름을 입력하세요.');
    if (categories.some(c => c.name === newCategoryName)) return alert('중복된 이름입니다.');
    
    await addCategory(newCategoryName, newCategoryColor);
    setNewCategoryName('');
  };

  return (
    <>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={newCategoryName} 
          onChange={(e) => setNewCategoryName(e.target.value)} 
          placeholder="새 카테고리"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input 
          type="color" 
          value={newCategoryColor} 
          onChange={(e) => setNewCategoryColor(e.target.value)} 
          style={{ width: '35px', height: '35px', border: 'none', cursor: 'pointer' }}
        />
        <button onClick={handleAddClick} style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          추가
        </button>
      </div>

      <DragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="categories" direction="horizontal">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {categories.map((cat, index) => (
                <Draggable key={cat.id || cat.name} draggableId={String(cat.id || cat.name)} index={index} isDragDisabled={cat.name === '전체'}>
                  {(providedD) => (
                    <button
                      ref={providedD.innerRef}
                      {...providedD.draggableProps}
                      {...(cat.name === '전체' ? {} : providedD.dragHandleProps)}
                      onClick={() => setFilterTag(cat.name)}
                      style={{
                        backgroundColor: cat.color || '#eee',
                        color: getContrastingTextColor(cat.color),
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: currentFilterTag === cat.name ? '2px solid black' : 'none',
                        cursor: 'pointer',
                        ...providedD.draggableProps.style
                      }}
                    >
                      {cat.name}
                      {cat.name !== '전체' && (
                        <span onClick={(e) => { e.stopPropagation(); if(window.confirm('삭제할까요?')) deleteCategory(cat.name); }} style={{ marginLeft: '8px' }}>×</span>
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