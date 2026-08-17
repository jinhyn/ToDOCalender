import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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

  const formatTime = (dateValue) => {
    if (!dateValue) return '';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (e) {
      return '';
    }
  };

  const getContrastingTextColor = (hexColor) => {
    if (!hexColor || hexColor.length < 4) return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const filteredTasks = tasks
    .filter((t) => (filterTag === '전체' ? true : t.tag === filterTag));

  const events = filteredTasks.map((t) => {
    const cat = categories.find((c) => c.name === t.tag) || categories.find(c => c.name === '일반');
    return {
      title: t.title,
      start: t.date,
      end: t.end,
      allDay: false,
      backgroundColor: cat ? cat.color : '#3788d8',
      borderColor: cat ? cat.color : '#3788d8',
      textColor: cat ? getContrastingTextColor(cat.color) : '#ffffff',
      display: 'block',
      extendedProps: {
        originalTask: t,
      },
    };
  });

  const handleEventDrop = (dropInfo) => {
    onEventOperation(dropInfo, 'drop');
  };

  const handleEventResize = (resizeInfo) => {
    onEventOperation(resizeInfo, 'resize');
  };

  const renderEventContent = (eventInfo) => {
    const isMonthView = eventInfo.view.type === 'dayGridMonth';
    const startTime = formatTime(eventInfo.event.start);
    const endTime = formatTime(eventInfo.event.end);

    return (
      <>
        <b>
          {isMonthView
            ? `${startTime}${endTime ? ` - ${endTime}` : ''}`
            : eventInfo.timeText}
        </b>
        <br />
        <i>{eventInfo.event.title}</i>
      </>
    );
  };

  return (
    <FullCalendar
      ref={calendarRefInternal}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="ko"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      buttonText={{
        today: '오늘',
        month: '월',
        week: '주',
        day: '일',
        list: '목록',
      }}
      events={events}
      dateClick={onDateClick}
      eventClick={onEventClick}
      editable={true}
      selectable={true}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      eventTimeFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
      eventContent={renderEventContent}
      droppable={true}
      nowIndicator={true}
      slotMinTime="00:00:00"
      slotMaxTime="24:00:00"
      allDaySlot={false}
      height="auto"
    />
  );
});

export default CalendarDisplay;
