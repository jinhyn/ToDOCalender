import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // 드래그, 드롭, 리사이즈 등에 필요

const CalendarDisplay = forwardRef(({
  tasks,
  categories,
  filterTag,
  onDateClick,
  onEventClick,
  onEventOperation, // onEventDrop과 onEventResize를 통합
}, ref) => {
  const calendarRefInternal = useRef(null);

  useImperativeHandle(ref, () => ({
    getApi: () => calendarRefInternal.current?.getApi(),
    refetchEvents: () => calendarRefInternal.current?.getApi()?.refetchEvents(),
  }));

  const formatTime = (isoString) => {
    if (!isoString || !isoString.includes('T')) return '';
    // Date 객체를 사용하여 로컬 시간대로 변환 후 포맷팅
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        console.warn("Invalid date string for formatting:", isoString);
        return isoString.split('T')[1]?.slice(0, 5) || ''; // Fallback
    }
  };

  // ✨ 여기로 함수 정의를 옮겼습니다.
  // 텍스트 색상 결정을 위한 함수 (CalendarDisplay 내부 또는 유틸리티 함수로 분리 가능)
  const getContrastingTextColor = (hexColor) => {
    if (!hexColor || hexColor.length < 4) return '#ffffff'; // 기본 흰색
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const filteredTasks = tasks
    .filter((t) => (filterTag === '전체' ? true : t.tag === filterTag));

  const events = filteredTasks.map((t) => {
    const cat = categories.find((c) => c.name === t.tag) || categories.find(c => c.name === '일반'); // 기본 카테고리
    return {
      // title: `${t.title} (${formatTime(t.date)} - ${formatTime(t.end)})`, // 시간 표시는 eventTimeFormat으로 대체
      title: t.title,
      start: t.date,
      end: t.end,
      allDay: false, 
      backgroundColor: cat ? cat.color : '#3788d8',
      borderColor: cat ? cat.color : '#3788d8',
      textColor: cat ? (getContrastingTextColor(cat.color)) : '#ffffff', // 텍스트 색상 동적 적용
      display: 'block',
      extendedProps: { 
        originalTask: t, // 원본 태스크 전체를 저장
      },
    };
  });

  // 텍스트 색상 결정을 위한 함수 (CalendarDisplay 내부 또는 유틸리티 함수로 분리 가능)
  // ✨ 원래 이 위치에 있었던 함수 정의를 위로 옮겼습니다.

  const handleEventDrop = (dropInfo) => {
    onEventOperation(dropInfo, 'drop');
  }

  const handleEventResize = (resizeInfo) => {
    onEventOperation(resizeInfo, 'resize');
  }

  // FullCalendar v6에서 eventContent를 사용하여 렌더링 커스터마이징
  const renderEventContent = (eventInfo) => {
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <br/>
        <i>{eventInfo.event.title}</i>
      </>
    );
  };

  return (
    <FullCalendar
      ref={calendarRefInternal}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth" // 초기 뷰
      locale='ko' // 한국어 설정
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      buttonText={{ // 버튼 텍스트 한국어화
          today:    '오늘',
          month:    '월',
          week:     '주',
          day:      '일',
          list:     '목록'
      }}
      events={events}
      dateClick={onDateClick} // 빈 날짜 클릭 시
      eventClick={onEventClick} // 기존 이벤트 클릭 시
      editable={true} // 이벤트 드래그, 리사이즈 가능하게
      selectable={true} // 날짜 드래그하여 선택 가능 (select 콜백 필요 시 추가)
      eventDrop={handleEventDrop} // 이벤트 드롭 시
      eventResize={handleEventResize} // 이벤트 리사이즈 시
      eventTimeFormat={{ // 이벤트 내 시간 표시 형식
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }}
      eventContent={renderEventContent} // 이벤트 내용 커스텀 렌더링
      droppable={true} // 외부 요소 드롭 허용 (현재 사용 안함)
      nowIndicator={true} // 현재 시간 표시
      slotMinTime="00:00:00" // 시간 그리드 최소 시간
      slotMaxTime="24:00:00" // 시간 그리드 최대 시간
      allDaySlot={false} // 종일 슬롯 숨김 (필요시 true)
      height="auto" // 내용에 따라 높이 자동 조절 (또는 "650px" 등 고정값)
    />
  );
});

export default CalendarDisplay;