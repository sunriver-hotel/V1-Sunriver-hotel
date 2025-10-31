import React from 'react';
import type { Language } from '../types';
import { translations } from '../constants';

interface CalendarProps {
  currentDate: Date;
  language: Language;
  occupancyMap: Map<string, number>;
  totalRooms: number;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, language, occupancyMap, totalRooms }) => {
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
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="border-r border-b border-gray-200"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const occupiedRooms = occupancyMap.get(dateString) || 0;
      const availableRooms = totalRooms - occupiedRooms;

      const isToday = date.getTime() === today.getTime();
      const isFull = availableRooms <= 0;
      
      const dayCellClasses = [
        "relative p-2 border-r border-b border-gray-200 flex flex-col justify-start items-start cursor-pointer transition-colors duration-200",
        isFull ? "bg-red-100 hover:bg-red-200" : "hover:bg-yellow-50",
      ].join(' ');
      
      const dayNumberClasses = [
        "text-sm font-semibold mb-1",
        isToday ? "bg-primary-yellow text-white rounded-full h-6 w-6 flex items-center justify-center" : "text-text-dark"
      ].join(' ');

      days.push(
        <div key={day} className={dayCellClasses} onClick={() => alert(`Booking for ${dateString}`)}>
          <span className={dayNumberClasses}>{day}</span>
          <div className="w-full text-center mt-auto">
             {isFull ? (
                <span className="text-xs font-bold text-red-600">เต็ม</span>
             ) : (
                <span className="text-xs font-bold text-green-600">
                    {availableRooms} <span className="font-normal text-text-light">{t.available}</span>
                </span>
             )}
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