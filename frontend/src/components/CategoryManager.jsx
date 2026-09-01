import React, { useEffect, useRef, useState } from 'react';
import './CategoryManager.css';

const CATEGORY_COLORS = [
  '#BFDBFE', '#C7D2FE', '#DDD6FE', '#FBCFE8', '#FECACA', '#FED7AA',
  '#FEF3C7', '#D9F99D', '#BBF7D0', '#CCFBF1', '#CFFAFE', '#E2E8F0',
];

const getContrastingTextColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
};

export default function CategoryManager({
  categories,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  setFilterTag,
  currentFilterTag,
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(CATEGORY_COLORS[0]);
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

  const handleAddClick = async () => {
    const name = newCategoryName.trim();
    if (!name) return alert('이름을 입력하세요.');
    if (categories.some((category) => category.name === name)) return alert('중복된 이름입니다.');
    try {
      await addCategory(name, newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor(CATEGORY_COLORS[0]);
    } catch (error) {
      alert(`카테고리 추가 실패: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditColor(category.color || CATEGORY_COLORS[0]);
  };

  const closeEdit = () => {
    setEditingCategory(null);
    setEditName('');
    setEditColor(CATEGORY_COLORS[0]);
  };

  const handleEditSave = async () => {
    if (!editingCategory) return;
    const name = editName.trim();
    if (!name) return alert('카테고리 이름을 입력하세요.');
    if (categories.some((category) => category.id !== editingCategory.id && category.name === name)) {
      return alert('중복된 이름입니다.');
    }

    try {
      await updateCategory(editingCategory.id, { name, color: editColor }, editingCategory.name);
      closeEdit();
    } catch (error) {
      alert(`카테고리 수정 실패: ${JSON.stringify(error.response?.data || error.message)}`);
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
          className="category-name-input"
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddClick(); }}
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
                    onClick={() => { setNewCategoryColor(color); setIsColorPickerOpen(false); }}
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

        <button type="button" className="category-add-button" onClick={handleAddClick}>추가</button>
      </div>

      <div className="category-bar">
        {categories.map((cat) => (
          <button
            key={cat.id || cat.name}
            type="button"
            className="category-chip"
            draggable={cat.name !== '전체'}
            onDragStart={(event) => handleDragStart(event, cat.id)}
            onDragOver={(event) => handleDragOver(event, cat.id)}
            onDrop={(event) => handleDrop(event, cat.id)}
            onDragEnd={clearDragState}
            onClick={() => setFilterTag(cat.name)}
            style={{
              backgroundColor: cat.color || '#eee',
              color: getContrastingTextColor(cat.color),
              padding: '8px 12px',
              borderRadius: 999,
              border: currentFilterTag === cat.name ? '2px solid #111827' : (dropTargetId === cat.id ? '2px dashed #111827' : '1px solid transparent'),
              cursor: cat.name === '전체' ? 'pointer' : (draggedId === cat.id ? 'grabbing' : 'grab'),
              opacity: draggedId === cat.id ? 0.6 : 1,
            }}
          >
            <span>{cat.name}</span>
            {cat.name !== '전체' && (
              <span
                className="category-edit-trigger"
                role="button"
                tabIndex={0}
                aria-label={`${cat.name} 카테고리 편집`}
                onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    openEdit(cat);
                  }
                }}
              >
                ⋯
              </span>
            )}
          </button>
        ))}
      </div>

      {editingCategory && (
        <div className="category-edit-card" aria-label={`${editingCategory.name} 카테고리 수정`}>
          <div className="category-edit-header">
            <div>
              <strong>카테고리 수정</strong>
              <span>이름과 색상을 바꿀 수 있어요.</span>
            </div>
            <button type="button" className="category-edit-close" onClick={closeEdit} aria-label="카테고리 수정 닫기">×</button>
          </div>

          <input
            className="category-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(); }}
            aria-label="수정할 카테고리 이름"
          />

          <div className="category-edit-colors" aria-label="카테고리 색상">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`category-edit-color${editColor === color ? ' selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setEditColor(color)}
                aria-label={`${color} 색상`}
                aria-pressed={editColor === color}
              >
                {editColor === color && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>

          <div className="category-edit-actions">
            <button
              type="button"
              className="category-edit-delete"
              onClick={async () => {
                if (!window.confirm(`'${editingCategory.name}' 카테고리를 삭제할까요?`)) return;
                await deleteCategory(editingCategory.id, editingCategory.name);
                closeEdit();
              }}
            >
              삭제
            </button>
            <div>
              <button type="button" className="category-edit-cancel" onClick={closeEdit}>취소</button>
              <button type="button" className="category-edit-save" onClick={handleEditSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
