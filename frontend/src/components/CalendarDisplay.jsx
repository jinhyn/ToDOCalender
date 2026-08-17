import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarDisplay = forwardRef(({ tasks, categories, filterTag, travelWarnings, onDateClick, onEventClick, onEventOperation }, ref) => {
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
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.max(0, Math.ceil((seconds || 0) / 60));
    return `${minutes}분`;
  };

  const getContrastingTextColor = (hexColor) => {
    if (!hexColor || hexColor.length < 7) return '#ffffff';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const filteredTasks = tasks.filter((t) => (filterTag === '전체' ? true : t.tag === filterTag));
  const events = filteredTasks.map((t) => {
    const cat = categories.find((c) => c.name === t.tag) || categories.find((c) => c.name === '일반');
    const travelWarning = travelWarnings?.[t.id] || null;
    return {
      title: t.title,
      start: t.date,
      end: t.end,
      allDay: false,
      backgroundColor: cat?.color || '#3788d8',
      borderColor: cat?.color || '#3788d8',
      textColor: cat ? getContrastingTextColor(cat.color) : '#ffffff',
      display: 'block',
      extendedProps: { originalTask: t, locationName: t.locationName || '', travelWarning },
    };
  });

  const renderEventContent = (eventInfo) => {
    const isMonthView = eventInfo.view.type === 'dayGridMonth';
    const startTime = formatTime(eventInfo.event.start);
    const endTime = formatTime(eventInfo.event.end);
    const locationName = eventInfo.event.extendedProps.locationName;
    const travelWarning = eventInfo.event.extendedProps.travelWarning;
    const timeText = isMonthView ? `${startTime}${endTime ? ` - ${endTime}` : ''}` : eventInfo.timeText;

    return (
      <div className="calendar-event-content">
        <div className="calendar-event-time">{timeText}</div>
        <div className="calendar-event-title">{eventInfo.event.title}</div>
        {locationName && <div className="calendar-event-location"><span aria-hidden="true">📍</span> {locationName}</div>}
        {travelWarning && <div className="calendar-event-warning"><span aria-hidden="true">⚠️</span> 이동 {formatDuration(travelWarning.travel_seconds)} 필요</div>}
      </div>
    );
  };

  return (
    <FullCalendar
      ref={calendarRefInternal}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale="ko"
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
      buttonText={{ today: '오늘', month: '월', week: '주', day: '일', list: '목록' }}
      events={events}
      dateClick={onDateClick}
      eventClick={onEventClick}
      editable={true}
      selectable={true}
      eventDrop={(info) => onEventOperation(info, 'drop')}
      eventResize={(info) => onEventOperation(info, 'resize')}
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
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
