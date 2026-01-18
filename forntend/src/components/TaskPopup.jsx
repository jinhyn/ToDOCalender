import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import { useKakaoMap } from '../hooks/useKakaoMap';

export default function TaskPopup({ show, onClose, onSave, categories, initialData }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [tag, setTag] = useState('일반');
  const [searchKeyword, setSearchKeyword] = useState('');

  const { 
    mapRef, searchLocation, selectedLocation, locationName, 
    searchResults, handleSearchResultClick, clearLocation 
  } = useKakaoMap(show, initialData?.task);

  // 초기화 함수
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

  // 💡 렌더링 루프 방지: 의존성 배열에서 categories를 제거했습니다.
  useEffect(() => {
    if (show) {
      if (initialData?.task) {
        const { task } = initialData;
        setTaskTitle(task.title || '');
        setStartDateTime(task.date?.slice(0, 16) || '');
        setEndDateTime(task.end?.slice(0, 16) || '');
        setTag(task.category_detail?.name || '일반');
      } else {
        resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initialData?.task?.id]); 

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!taskTitle.trim() || !selectedLocation) return alert('제목과 위치를 확인해주세요.');

    onSave({
      id: initialData?.task?.id,
      title: taskTitle.trim(),
      date: startDateTime,
      end: endDateTime,
      tag: tag,
      location: selectedLocation,
      locationName: locationName,
    });
  };

  if (!show) return null;

  const selectOptions = categories
    .filter(cat => cat.name !== '전체')
    .map(cat => ({ value: cat.name, label: cat.name }));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
          {initialData?.task ? '🗓️ 일정 수정' : '🗓️ 새 일정 추가'}
        </h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ fontWeight: 'bold' }}>제목</label>
            <input 
              type="text" 
              value={taskTitle} 
              onChange={(e) => setTaskTitle(e.target.value)} // 이제 입력이 튕기지 않습니다.
              placeholder="할 일 제목"
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <label style={{ fontWeight: 'bold' }}>태그</label>
            <Select 
              options={selectOptions} 
              value={selectOptions.find(o => o.value === tag)}
              onChange={(opt) => setTag(opt?.value || '일반')} 
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} style={{ flex: 1, padding: '8px' }} />
              <input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} style={{ flex: 1, padding: '8px' }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold' }}>위치 검색</label>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} style={{ flex: 1, padding: '8px' }} />
              <button type="button" onClick={() => searchLocation(searchKeyword)} style={{ padding: '8px 15px' }}>검색</button>
            </div>
            <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '10px' }}>
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => handleSearchResultClick(res)} style={{ padding: '5px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                  {res.place_name}
                </div>
              ))}
            </div>
            <div ref={mapRef} style={{ width: '100%', height: '180px', borderRadius: '4px', border: '1px solid #ddd' }}></div>
            {locationName && <div style={{ marginTop: '5px', fontSize: '13px' }}>📍 {locationName}</div>}
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          {initialData?.task && (
            <button type="button" onClick={() => initialData.onDelete(initialData.task.id)} style={{ backgroundColor: '#ff5252', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>삭제</button>
          )}
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', cursor: 'pointer' }}>닫기</button>
          <button type="button" onClick={handleSubmit} style={{ backgroundColor: '#4caf50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {initialData?.task ? '수정 완료' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  );
}