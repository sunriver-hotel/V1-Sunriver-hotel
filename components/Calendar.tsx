import React from 'react';
import type { Language } from '../types';
import { translations } from '../constants';

interface CalendarProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  language: Language;
  occupancyMap: Map<string, number>;
  totalRooms: number;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, selectedDate, onDateSelect, language, occupancyMap, totalRooms }) => {
  const t = translations[language];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="border-r border-b border-gray-200"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      // สร้าง Date object ในระบบ UTC เพื่อให้ตรงกับ key ของ occupancyMap
      const date = new Date(Date.UTC(year, month, day));
      const dateString = date.toISOString().split('T')[0];
      
      const occupiedRooms = occupancyMap.get(dateString) || 0;
      const availableRooms = totalRooms - occupiedRooms;

      // สำหรับการเปรียบเทียบ isToday และ isSelected ต้องใช้ UTC ด้วย
      const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const selectedDateUTC = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));

      const isToday = date.getTime() === todayUTC.getTime();
      const isSelected = date.getTime() === selectedDateUTC.getTime();
      
      const dayCellClasses = [
        "relative p-2 border-r border-b border-gray-200 flex flex-col justify-start items-start cursor-pointer transition-colors duration-200",
        isSelected ? "bg-primary-yellow bg-opacity-20" : "hover:bg-yellow-50",
      ].join(' ');
      
      const dayNumberClasses = [
        "text-sm font-semibold mb-1",
        isToday ? "bg-primary-yellow text-white rounded-full h-6 w-6 flex items-center justify-center" : "text-text-dark"
      ].join(' ');
      
      const handleDateSelect = () => {
        // เมื่อเลือกวัน ให้ส่งค่ากลับเป็น Local time เพื่อให้ UI ส่วนอื่นทำงานถูกต้อง
        const localDate = new Date(year, month, day);
        localDate.setHours(0,0,0,0);
        onDateSelect(localDate);
      }

      days.push(
        <div key={day} className={dayCellClasses} onClick={handleDateSelect}>
          <span className={dayNumberClasses}>{day}</span>
          <div className="w-full text-center mt-auto space-y-1">
             <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs font-bold text-green-600">
                    {availableRooms} <span className="font-normal text-text-light hidden md:inline">{t.vacant}</span>
                </span>
             </div>
             <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs font-bold text-red-600">
                    {occupiedRooms} <span className="font-normal text-text-light hidden md:inline">{t.booked}</span>
                </span>
             </div>
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="grid grid-cols-7 text-center font-medium text-text-light border-b border-gray-200">
        {t.daysShort.map(day => (
          <div key={day} className="py-2 border-r border-gray-200 last:border-r-0">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-grow">
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;