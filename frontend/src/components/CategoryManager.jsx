import React, { useEffect, useRef, useState } from 'react';

const CATEGORY_COLORS = [
  '#BFDBFE', // blue
  '#C7D2FE', // indigo
  '#DDD6FE', // violet
  '#FBCFE8', // pink
  '#FECACA', // red
  '#FED7AA', // orange
  '#FEF3C7', // amber
  '#D9F99D', // lime
  '#BBF7D0', // green
  '#CCFBF1', // teal
  '#CFFAFE', // cyan
  '#E2E8F0', // slate
];

const getContrastingTextColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
};

export default function CategoryManager({ categories, addCategory, deleteCategory, reorderCategories, setFilterTag, currentFilterTag }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleColorSelect = (color) => {
    setNewCategoryColor(color);
    setIsColorPickerOpen(false);
  };

  const handleAddClick = async () => {
    if (!newCategoryName.trim()) return alert('이름을 입력하세요.');
    if (categories.some((c) => c.name === newCategoryName.trim())) return alert('중복된 이름입니다.');
    try {
      await addCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor(CATEGORY_COLORS[0]);
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
    } catch {
      alert('카테고리 순서 저장에 실패했습니다.');
    }
  };

  return (
    <>
      <div className="category-form">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="새 카테고리 이름"
          aria-label="새 카테고리 이름"
        />

        <div className="category-color-picker" ref={colorPickerRef}>
          <button
            type="button"
            className="category-color-trigger"
            onClick={() => setIsColorPickerOpen((open) => !open)}
            aria-label="카테고리 색상 선택"
            aria-expanded={isColorPickerOpen}
            title="카테고리 색상 선택"
          >
            <span className="category-color-preview" style={{ backgroundColor: newCategoryColor }} />
            <span className="category-color-trigger-label">색상</span>
            <span className="category-color-chevron" aria-hidden="true">⌄</span>
          </button>

          {isColorPickerOpen && (
            <div className="category-color-popover" role="dialog" aria-label="카테고리 색상 선택">
              <div className="category-color-popover-title">색상 선택</div>
              <div className="category-color-grid">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`category-color-option${newCategoryColor === color ? ' selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    aria-label={`${color} 색상`}
                    aria-pressed={newCategoryColor === color}
                  >
                    {newCategoryColor === color && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
              <div className="category-color-hint">캘린더에서 보기 편한 색상으로 구성했어요.</div>
            </div>
          )}
        </div>

        <button className="category-add-button" onClick={handleAddClick}>추가</button>
      </div>

      <div className="category-bar">
        {categories.map((cat) => (
          <button
            key={cat.id || cat.name}
            className="category-chip"
            draggable
            onDragStart={(event) => handleDragStart(event, cat.id)}
            onDragOver={(event) => handleDragOver(event, cat.id)}
            onDrop={(event) => handleDrop(event, cat.id)}
            onDragEnd={clearDragState}
            onClick={() => setFilterTag(cat.name)}
            style={{
              backgroundColor: cat.color || '#eee',
              color: getContrastingTextColor(cat.color),
              padding: '8px 14px',
              borderRadius: 999,
              border: currentFilterTag === cat.name ? '2px solid #111827' : (dropTargetId === cat.id ? '2px dashed #111827' : '1px solid transparent'),
              cursor: draggedId === cat.id ? 'grabbing' : 'grab',
              opacity: draggedId === cat.id ? 0.6 : 1,
            }}
          >
            {cat.name}
            {cat.name !== '전체' && (
              <span
                className="category-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('카테고리를 삭제할까요?')) deleteCategory(cat.id, cat.name);
                }}
                style={{ marginLeft: 8 }}
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
