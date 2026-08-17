import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useKakaoMap } from '../hooks/useKakaoMap';

export default function TaskPopup({ show, onClose, onSave, categories, initialData }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [tag, setTag] = useState('일반');
  const [searchKeyword, setSearchKeyword] = useState('');
  const { mapRef, searchLocation, selectedLocation, locationName, searchResults, handleSearchResultClick, clearLocation } = useKakaoMap(show, initialData?.task);

  const resetForm = useCallback(() => {
    const now = new Date();
    const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setTaskTitle('');
    setStartDateTime(initialData?.defaultDate ? `${initialData.defaultDate}T09:00` : localTime);
    setEndDateTime(initialData?.defaultDate ? `${initialData.defaultDate}T09:30` : localTime);
    setTag('일반');
    setSearchKeyword('');
    clearLocation();
  }, [initialData, clearLocation]);

  useEffect(() => {
    if (!show) return;
    if (initialData?.task) {
      const { task } = initialData;
      setTaskTitle(task.title || '');
      setStartDateTime(task.date?.slice(0, 16) || '');
      setEndDateTime(task.end?.slice(0, 16) || '');
      setTag(task.category_detail?.name || '일반');
    } else resetForm();
  }, [show, initialData?.task?.id, resetForm, initialData?.task]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!taskTitle.trim() || !selectedLocation) return alert('제목과 위치를 확인해주세요.');
    onSave({ id: initialData?.task?.id, title: taskTitle.trim(), date: startDateTime, end: endDateTime, tag, location: selectedLocation, locationName });
  };

  if (!show) return null;
  const selectOptions = categories.filter((cat) => cat.name !== '전체').map((cat) => ({ value: cat.name, label: cat.name }));

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="task-modal-header">
          <div>
            <div className="task-modal-eyebrow">CALENDAR</div>
            <h3 id="task-modal-title">{initialData?.task ? '일정 수정' : '새 일정 추가'}</h3>
          </div>
          <button type="button" className="task-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="task-form-grid">
            <div className="form-section">
              <div className="form-section-heading">일정 정보</div>
              <label className="form-label" htmlFor="task-title">제목</label>
              <input id="task-title" className="form-input" type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="할 일 제목" />
              <label className="form-label">카테고리</label>
              <Select options={selectOptions} value={selectOptions.find((o) => o.value === tag)} onChange={(opt) => setTag(opt?.value || '일반')} styles={{ control: (base) => ({ ...base, borderRadius: 10, borderColor: '#dfe3e8', minHeight: 42 }) }} />
              <label className="form-label">일정 시간</label>
              <div className="datetime-row"><input aria-label="시작 시간" className="form-input" type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} /><input aria-label="종료 시간" className="form-input" type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} /></div>
            </div>
            <div className="form-section location-section">
              <div className="form-section-heading">위치</div>
              <div className="selected-location-text"><span className="selected-location-icon">📍</span><span className="selected-location-value">{locationName || '장소를 검색하고 선택해주세요.'}</span></div>
              <label className="form-label" htmlFor="location-search">위치 검색</label>
              <div className="location-search"><input id="location-search" className="form-input" type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="장소를 검색하세요" /><button type="button" className="location-search-button" onClick={() => searchLocation(searchKeyword)}>검색</button></div>
              <div className="search-results">{searchResults.map((res, i) => <div key={i} className="search-result" onClick={() => handleSearchResultClick(res)}>{res.place_name}</div>)}</div>
              <div ref={mapRef} className="task-map" />
            </div>
          </div>
          <div className="modal-actions">
            {initialData?.task && <button type="button" className="modal-button danger" onClick={() => initialData.onDelete(initialData.task.id)}>삭제</button>}
            <div className="modal-actions-right"><button type="button" className="modal-button secondary" onClick={onClose}>닫기</button><button type="submit" className="modal-button primary">{initialData?.task ? '수정 완료' : '추가하기'}</button></div>
          </div>
        </form>
      </div>
    </div>
  );
}
