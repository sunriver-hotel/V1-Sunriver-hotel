import React, { useState } from 'react';
import type { Language, Booking } from '../types';
import { translations } from '../constants';

interface DailySummaryProps {
  selectedDate: Date;
  language: Language;
  checkIns: Booking[];
  checkOuts: Booking[];
  staying: Booking[];
  onEditBooking: (booking: Booking) => void;
  onDateChange: (date: string) => void;
}

const SummarySection: React.FC<{ title: string; count: number; bookings: Booking[]; onEditBooking: (booking: Booking) => void; language: Language; }> = ({ title, count, bookings, onEditBooking, language }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <h3 className="text-lg font-semibold text-text-dark">{title}</h3>
        <span className="bg-primary-yellow text-white text-sm font-bold px-2 py-1 rounded-full">{count}</span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2">
          {bookings.length === 0 ? (
            <p className="text-text-light italic">{translations[language].noActivity}</p>
          ) : (
            bookings.map(booking => (
              <div key={booking.booking_id} onClick={() => onEditBooking(booking)} className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-yellow-50 transition-colors">
                <p className="font-semibold">{booking.customer?.customer_name}</p>
                <p className="text-sm text-text-light">{booking.customer?.phone}</p>
                <p className="text-sm text-text-light">Room: {booking.room?.room_number}</p>
                <p className="text-xs text-gray-500">Check-in: {booking.check_in_date} | Check-out: {booking.check_out_date}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const DailySummary: React.FC<DailySummaryProps> = ({ selectedDate, language, checkIns, checkOuts, staying, onEditBooking, onDateChange }) => {
  const t = translations[language];
  const formattedDate = selectedDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper to format date for the input[type=date]
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="w-full">
        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
            <h2 className="text-xl font-bold text-text-dark">Summary for {formattedDate}</h2>
            <input 
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                aria-label="Select a date for the summary"
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummarySection title={t.checkIns} count={checkIns.length} bookings={checkIns} onEditBooking={onEditBooking} language={language} />
            <SummarySection title={t.checkOuts} count={checkOuts.length} bookings={checkOuts} onEditBooking={onEditBooking} language={language}/>
            <SummarySection title={t.staying} count={staying.length} bookings={staying} onEditBooking={onEditBooking} language={language}/>
        </div>
    </div>
  );
};

export default DailySummary;