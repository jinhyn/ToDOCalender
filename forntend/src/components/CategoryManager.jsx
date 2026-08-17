import React, { useState } from 'react';

const getContrastingTextColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export default function CategoryManager({ categories, addCategory, deleteCategory, reorderCategories, setFilterTag, currentFilterTag }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4A90E2');
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const handleAddClick = async () => {
    if (!newCategoryName.trim()) return alert('이름을 입력하세요.');
    if (categories.some((c) => c.name === newCategoryName.trim())) return alert('중복된 이름입니다.');
    try {
      await addCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
    } catch (error) {
      alert(`카테고리 추가 실패: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  const handleDragStart = (event, categoryId) => {
    setDraggedId(categoryId);
    setDropTargetId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(categoryId));
  };

  const handleDragOver = (event, categoryId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (draggedId !== categoryId) setDropTargetId(categoryId);
  };

  const clearDragState = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleDrop = async (event, destinationId) => {
    event.preventDefault();
    const sourceId = Number(event.dataTransfer.getData('text/plain'));
    clearDragState();

    if (!Number.isInteger(sourceId) || sourceId === destinationId) return;

    const sourceIndex = categories.findIndex((category) => category.id === sourceId);
    const destinationIndex = categories.findIndex((category) => category.id === destinationId);
    if (sourceIndex < 0 || destinationIndex < 0) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    try {
      await reorderCategories(reordered);
    } catch (error) {
      alert('카테고리 순서 저장에 실패했습니다.');
    }
  };

  return (
    <>
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="새 카테고리" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} style={{ width: '35px', height: '35px', border: 'none', cursor: 'pointer' }} />
        <button onClick={handleAddClick} style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>추가</button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id || cat.name}
            draggable
            onDragStart={(event) => handleDragStart(event, cat.id)}
            onDragOver={(event) => handleDragOver(event, cat.id)}
            onDrop={(event) => handleDrop(event, cat.id)}
            onDragEnd={clearDragState}
            onClick={() => setFilterTag(cat.name)}
            style={{
              backgroundColor: cat.color || '#eee',
              color: getContrastingTextColor(cat.color),
              padding: '8px 16px',
              borderRadius: '20px',
              border: currentFilterTag === cat.name ? '2px solid black' : (dropTargetId === cat.id ? '2px dashed black' : 'none'),
              cursor: draggedId === cat.id ? 'grabbing' : 'grab',
              opacity: draggedId === cat.id ? 0.6 : 1,
            }}
          >
            {cat.name}
            {cat.name !== '전체' && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('삭제할까요?')) deleteCategory(cat.id, cat.name);
                }}
                style={{ marginLeft: '8px' }}
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
