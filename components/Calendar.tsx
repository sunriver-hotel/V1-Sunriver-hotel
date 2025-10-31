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
      // Create a Date object in UTC to match the occupancyMap keys and for reliable comparisons.
      const date = new Date(Date.UTC(year, month, day));
      const dateString = date.toISOString().split('T')[0];
      
      const occupiedRooms = occupancyMap.get(dateString) || 0;
      const availableRooms = totalRooms - occupiedRooms;

      // Use UTC dates for all comparisons to avoid timezone-related bugs.
      const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      // selectedDate is now guaranteed to be a UTC date from the dashboard state.
      const selectedTime = selectedDate.getTime();

      const isToday = date.getTime() === todayUTC.getTime();
      const isSelected = date.getTime() === selectedTime;
      
      const dayCellClasses = [
        "relative p-1 sm:p-2 border-r border-b border-gray-200 flex flex-col justify-start items-center cursor-pointer transition-colors duration-200",
        isSelected ? "bg-primary-yellow bg-opacity-20" : "hover:bg-yellow-50",
      ].join(' ');
      
      const dayNumberClasses = [
        "text-xs sm:text-sm font-semibold mb-1",
        isToday ? "bg-primary-yellow text-white rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center" : "text-text-dark"
      ].join(' ');
      
      const handleDateSelect = () => {
        // Pass the UTC date object directly back to the dashboard.
        onDateSelect(date);
      }

      days.push(
        <div key={day} className={dayCellClasses} onClick={handleDateSelect}>
          <span className={dayNumberClasses}>{day}</span>
          <div className="w-full text-center mt-auto space-y-1">
             <div className="flex items-center justify-center gap-1 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                <span className="text-[10px] sm:text-xs font-bold text-green-600">
                    {availableRooms} <span className="font-normal text-text-light hidden md:inline">{t.vacant}</span>
                </span>
             </div>
             <div className="flex items-center justify-center gap-1 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                <span className="text-[10px] sm:text-xs font-bold text-red-600">
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
    <div className="bg-white rounded-lg shadow-lg flex flex-col">
      <div className="grid grid-cols-7 text-center font-medium text-text-light border-b border-gray-200">
        {t.daysShort.map(day => (
          <div key={day} className="py-2 border-r border-gray-200 last:border-r-0 text-xs sm:text-sm">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-grow">
        {renderDays()}
      </div>
    </div>
  );
};

export default Calendar;