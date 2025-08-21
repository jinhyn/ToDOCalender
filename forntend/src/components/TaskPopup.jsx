import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useKakaoMap } from '../hooks/useKakaoMap'; // Kakao 지도 관련 커스텀 훅
import { useRef } from 'react'; // useRef 훅을 import

export default function TaskPopup({
  show, // 팝업 노출 여부
  onClose, // 팝업 닫기 콜백
  onSave, // 저장 콜백
  categories, // 태그 카테고리 리스트
  initialData, // 초기 데이터 ({ task, index, defaultDate, onDelete })
}) {
  const [taskTitle, setTaskTitle] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [tag, setTag] = useState('일반');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);  // For disabling search button when input is empty
  
  // Kakao Map 관련 상태와 메소드들 가져오기
  const { 
    mapRef,
    searchLocation: searchMapLocation,
    selectedLocation,
    locationName,
    setSelectedLocation,
    setLocationName,
    searchResults, // 검색된 장소 리스트
    handleSearchResultClick, // 검색 결과 클릭 핸들러
    clearLocation: clearMapLocation
  } = useKakaoMap(show, initialData?.task);

  // 폼 상태 초기화 함수
  const resetFormState = useCallback(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);

    setTaskTitle('');
    setStartDateTime(initialData?.defaultDate ? `${initialData.defaultDate}T09:00` : localISOTime);
    setEndDateTime(initialData?.defaultDate ? `${initialData.defaultDate}T09:30` : localISOTime);
    setTag(categories.find(c => c.name === '일반') ? '일반' : (categories[1]?.name || ''));
    setSearchKeyword('');
    clearMapLocation();
  }, [categories, initialData?.defaultDate, clearMapLocation]);

  useEffect(() => {
    if (show) {
      if (initialData && initialData.task) {
        const { task } = initialData;
        setTaskTitle(task.title);
        setStartDateTime(task.date ? task.date.slice(0, 16) : '');
        setEndDateTime(task.end ? task.end.slice(0, 16) : '');
        setTag(task.tag || (categories.find(c => c.name === '일반') ? '일반' : (categories[1]?.name || '')) );
      } else {
        resetFormState();
      }
    }
  }, [show, initialData?.task?.title]);

const handleSubmit = async () => {
  if (!taskTitle.trim()) {
    alert('할 일 제목을 입력해주세요.');
    return;
  }
  if (!startDateTime || !endDateTime) {
    alert('시작 시간과 종료 시간을 모두 입력해주세요.');
    return;
  }
  if (new Date(startDateTime) >= new Date(endDateTime)) {
    alert('종료 시간은 시작 시간보다 나중이어야 합니다.');
    return;
  }
  if (!selectedLocation) {
    alert('위치를 선택해주세요.');
    return;
  }

  const saveData = {
    title: taskTitle.trim(),
    date: startDateTime,
    end: endDateTime,
    category: categories.find(c => c.name === tag)?.id,  // category의 id 값을 보냄
    location: selectedLocation,
    location_name: locationName,
  };

  try {
    const response = await fetch('http://localhost:8000/api/tasks/', {
      method: initialData?.task ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      throw new Error('저장 실패');
    }

    alert('저장 완료!');
    handleClose();

  } catch (error) {
    console.error(error);
    alert('저장 중 오류가 발생했습니다.');
  }

  onSave({
    title: taskTitle.trim(),
    date: startDateTime,
    end: endDateTime,
    tag: tag,
    location: selectedLocation,
    locationName: locationName,
  }, initialData?.index);
  handleClose();
};


  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return; // Do nothing if the search input is empty
    searchMapLocation(searchKeyword); // 검색 실행
    setIsSearchActive(false);  // Disable search button while searching
  };

  // 검색된 장소 리스트 출력
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return <p>검색된 결과가 없습니다.</p>;
    }

  return (
    <ul>
      {searchResults.map((result, index) => (
        <li key={index} onClick={() => handleSearchResultClick(result)}>
          <div>
            {result.place_name}
            {/* 주소 추가 */}
            <div style={{ fontSize: '12px', color: '#888' }}>
              {result.road_address_name || result.address_name || '주소 정보 없음'}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

  if (!show) return null;

  const selectOptions = categories
    .filter(cat => cat.name !== '전체')
    .map((cat) => ({ value: cat.name, label: cat.name }));

  const currentTagValue = selectOptions.find(opt => opt.value === tag);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', fontSize: '22px' }}>
          {initialData?.task ? '🗓️ 일정 수정' : '🗓️ 새 일정 추가'}
        </h3>

        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* 제목 입력 */}
            <div>
              <label htmlFor="taskTitle" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>제목</label>
              <input id="taskTitle" type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="할 일 제목" style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            {/* 태그 선택 */}
            <div>
              <label htmlFor="taskTag" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>태그</label>
              <Select inputId="taskTag" options={selectOptions} onChange={(selected) => setTag(selected?.value || '일반')} value={currentTagValue} placeholder="태그 선택" styles={{ control: (base) => ({ ...base, minHeight: '40px' }) }} />
            </div>

            {/* 시작 시간 */}
            <div>
              <label htmlFor="startTime" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>시작 시간</label>
              <input id="startTime" type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            {/* 종료 시간 */}
            <div>
              <label htmlFor="endTime" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>종료 시간</label>
              <input id="endTime" type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
          </div>

          <div style={{ flex: '1 1 320px', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* 위치 검색 입력 */}
            <div>
              <label htmlFor="locationSearch" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>위치 (선택)</label>
              <form onSubmit={handleLocationSearch} style={{ display: 'flex', gap: '5px' }}>
                <input id="locationSearch" type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="장소, 주소 검색" style={{ flexGrow: 1, padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} />
                <button type="submit" disabled={!searchKeyword.trim()} style={{ padding: '10px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#5c6bc0', color: 'white', cursor: 'pointer' }}>검색</button>
              </form>
            </div>

            {/* 검색된 결과 리스트 */}
            {renderSearchResults()}

            {/* 선택된 위치 이름 */}
            {locationName && (
              <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '14px' }}>
                선택한 위치: {locationName}{' '}
                <button onClick={clearMapLocation} style={{ fontSize: '12px', padding: '3px 6px', marginLeft: '5px', border: '1px solid #aaa', background: '#eee', borderRadius: '3px', cursor: 'pointer' }}>위치 초기화</button>
              </div>
            )}

            {/* 지도 표시 영역 */}
            <div ref={mapRef} style={{ width: '100%', height: '250px', backgroundColor: '#e9e9e9', borderRadius: '4px' }}></div>
          </div>
        </div>

        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          {initialData?.task && initialData.onDelete && (
            <button onClick={() => { if (window.confirm("이 일정을 삭제하시겠습니까?")) { initialData.onDelete(initialData.index); handleClose(); }}} style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#e57373', color: 'white', cursor: 'pointer' }}>삭제</button>
          )}
          <button onClick={handleClose} style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f8f9fa', cursor: 'pointer' }}>닫기</button>
          <button onClick={handleSubmit} style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer' }}>
            {initialData?.task ? '수정 완료' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
