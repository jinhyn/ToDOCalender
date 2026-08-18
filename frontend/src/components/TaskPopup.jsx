import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useKakaoMap } from '../hooks/useKakaoMap';
import './LocationSuggestions.css';

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, '0');
  const minute = String((index % 4) * 15).padStart(2, '0');
  return `${hour}:${minute}`;
});

function splitDateTime(value) {
  if (!value) return { date: '', time: '' };
  const localValue = value.slice(0, 16);
  const [date = '', time = ''] = localValue.split('T');
  return { date, time };
}

export default function TaskPopup({ show, onClose, onSave, categories, initialData }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [tag, setTag] = useState('일반');
  const [searchKeyword, setSearchKeyword] = useState('');
  const {
    mapRef,
    searchLocation,
    searchLocationSuggestions,
    selectedLocation,
    locationName,
    setLocationName,
    searchResults,
    relatedSearches,
    handleSearchResultClick,
    clearLocation,
  } = useKakaoMap(show, initialData?.task);

  const taskId = initialData?.task?.id ?? null;
  const taskDate = initialData?.task?.date ?? '';
  const taskEnd = initialData?.task?.end ?? '';
  const taskTitleValue = initialData?.task?.title ?? '';
  const taskCategory = initialData?.task?.category_detail?.name ?? '일반';
  const defaultDate = initialData?.defaultDate ?? '';
  const travelWarning = initialData?.travelWarning;

  useEffect(() => {
    if (!show) return;

    if (taskId !== null) {
      const start = splitDateTime(taskDate);
      const end = splitDateTime(taskEnd || taskDate);
      setTaskTitle(taskTitleValue);
      setStartDate(start.date);
      setStartTime(start.time || '09:00');
      setEndDate(end.date);
      setEndTime(end.time || '09:30');
      setTag(taskCategory);
      setSearchKeyword('');
      return;
    }

    const now = new Date();
    const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16);
    const defaultStart = defaultDate ? `${defaultDate}T09:00` : localTime;
    const defaultEnd = defaultDate ? `${defaultDate}T09:30` : localTime;
    const start = splitDateTime(defaultStart);
    const end = splitDateTime(defaultEnd);

    setTaskTitle('');
    setStartDate(start.date);
    setStartTime(start.time);
    setEndDate(end.date);
    setEndTime(end.time);
    setTag('일반');
    setSearchKeyword('');
    clearLocation();
  }, [show, taskId, taskDate, taskEnd, taskTitleValue, taskCategory, defaultDate, clearLocation]);

  useEffect(() => {
    if (!show || !searchKeyword.trim() || searchKeyword.trim() === locationName.trim()) return;

    const timer = window.setTimeout(() => {
      searchLocationSuggestions(searchKeyword);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [show, searchKeyword, locationName, searchLocationSuggestions]);

  useEffect(() => {
    if (show && taskId !== null) setSearchKeyword(locationName || '');
  }, [show, taskId, locationName]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!taskTitle.trim() || !selectedLocation) {
      return alert('제목과 위치를 확인해주세요.');
    }

    const startValue = `${startDate}T${startTime}`;
    const endValue = `${endDate}T${endTime}`;
    if (!startDate || !endDate || !startTime || !endTime || new Date(endValue) < new Date(startValue)) {
      return alert('종료 시간은 시작 시간보다 빠를 수 없습니다.');
    }

    onSave({
      id: taskId,
      title: taskTitle.trim(),
      date: startValue,
      end: endValue,
      tag,
      location: selectedLocation,
      locationName: locationName.trim(),
    });
  };

  if (!show) return null;

  const selectOptions = categories
    .filter((cat) => cat.name !== '전체')
    .map((cat) => ({ value: cat.name, label: cat.name }));

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="task-modal-header">
          <div>
            <div className="task-modal-eyebrow">CALENDAR</div>
            <h3 id="task-modal-title">{taskId !== null ? '일정 수정' : '새 일정 추가'}</h3>
          </div>
          <button type="button" className="task-modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {travelWarning && (
            <div className="task-travel-warning">
              <div className="task-travel-warning-title">⚠️ 이동시간이 부족합니다</div>
              <div className="task-travel-warning-text">
                이전 일정 <strong>{travelWarning.previous_title}</strong>에서 이동해야 합니다. 예상 이동시간은{' '}
                <strong>{formatDuration(travelWarning.travel_seconds)}</strong>이고, 이동 가능한 시간은{' '}
                <strong>{formatDuration(travelWarning.available_seconds)}</strong>입니다.
              </div>
              <div className="task-travel-warning-deficit">약 {formatDuration(travelWarning.deficit_seconds)} 부족</div>
            </div>
          )}

          <div className="task-form-grid">
            <div className="form-section">
              <div className="form-section-heading">일정 정보</div>
              <label className="form-label" htmlFor="task-title">제목</label>
              <input id="task-title" className="form-input" type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="할 일 제목" />

              <label className="form-label">카테고리</label>
              <Select
                options={selectOptions}
                value={selectOptions.find((o) => o.value === tag)}
                onChange={(opt) => setTag(opt?.value || '일반')}
                styles={{ control: (base) => ({ ...base, borderRadius: 10, borderColor: '#d9e0d6', minHeight: 42 }) }}
              />

              <div className="form-label-row">
                <label className="form-label">일정 시간</label>
                <span className="form-help">15분 단위로 선택할 수 있어요</span>
              </div>
              <div className="schedule-time-card">
                <div className="schedule-time-row">
                  <div>
                    <span className="schedule-time-label">시작</span>
                    <div className="schedule-time-controls">
                      <input className="form-input schedule-date-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="시작 날짜" />
                      <select className="form-input schedule-time-select" value={startTime} onChange={(e) => setStartTime(e.target.value)} aria-label="시작 시간">
                        {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                  </div>
                  <span className="schedule-arrow" aria-hidden="true">→</span>
                  <div>
                    <span className="schedule-time-label">종료</span>
                    <div className="schedule-time-controls">
                      <input className="form-input schedule-date-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="종료 날짜" />
                      <select className="form-input schedule-time-select" value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-label="종료 시간">
                        {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="schedule-quick-actions">
                  {[30, 60, 90].map((minutes) => (
                    <button key={minutes} type="button" onClick={() => applyDuration(minutes, startDate, startTime, setEndDate, setEndTime)}>{minutes}분</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-section location-section">
              <div className="form-section-heading">위치</div>
              <div className="selected-location-edit-card">
                <div className="selected-location-edit-label">선택한 장소</div>
                <div className="location-name-edit-row">
                  <span className="selected-location-icon">📍</span>
                  <input className="form-input location-name-input" type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="장소 이름" aria-label="선택한 장소 이름" />
                </div>
                <div className="location-edit-hint">장소 이름만 바꾸고 싶다면 여기서 일부 단어를 수정하세요. 지도 위치는 그대로 유지됩니다.</div>
              </div>

              <label className="form-label" htmlFor="location-search">다른 장소로 변경</label>
              <div className="location-search">
                <input id="location-search" className="form-input" type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="장소 이름을 입력하세요" autoComplete="off" />
                <button type="button" className="location-search-button" onClick={() => searchLocation(searchKeyword)}>검색</button>
              </div>
              <div className="location-search-hint">장소 이름을 입력하면 연관 검색어와 장소가 나타나요.</div>

              {(relatedSearches.length > 0 || searchResults.length > 0) && searchKeyword.trim() !== locationName.trim() && (
                <div className="location-search-panel">
                  {relatedSearches.length > 0 && (
                    <div className="location-related-section">
                      <div className="location-suggestion-heading">연관 검색어</div>
                      {relatedSearches.map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion}
                          className="location-related-item"
                          onClick={() => {
                            setSearchKeyword(suggestion);
                            searchLocation(suggestion);
                          }}
                        >
                          <span className="location-related-icon" aria-hidden="true">⌕</span>
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="location-results-section">
                      <div className="location-suggestion-heading">장소</div>
                      <div className="location-suggestion-list" role="listbox" aria-label="검색된 장소">
                        {searchResults.map((res, i) => (
                          <button
                            type="button"
                            key={`${res.id || res.place_name}-${i}`}
                            className="location-suggestion-item"
                            onClick={() => {
                              handleSearchResultClick(res);
                              setSearchKeyword(res.place_name);
                            }}
                          >
                            <span className="location-suggestion-pin">📍</span>
                            <span className="location-suggestion-content">
                              <strong>{res.place_name}</strong>
                              <small>{res.road_address_name || res.address_name}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div ref={mapRef} className="task-map" />
            </div>
          </div>

          <div className="modal-actions">
            {taskId !== null && <button type="button" className="modal-button danger" onClick={() => initialData.onDelete(taskId)}>삭제</button>}
            <div className="modal-actions-right">
              <button type="button" className="modal-button secondary" onClick={onClose}>닫기</button>
              <button type="submit" className="modal-button primary">{taskId !== null ? '수정 완료' : '추가하기'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function applyDuration(minutes, startDate, startTime, setEndDate, setEndTime) {
  if (!startDate || !startTime) return;
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(start.getTime() + minutes * 60000);
  const local = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [date, time] = local.split('T');
  setEndDate(date);
  setEndTime(time);
}

function formatDuration(seconds) {
  const minutes = Math.max(0, Math.ceil((seconds || 0) / 60));
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
}
