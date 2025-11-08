import React, { useState } from 'react';
import type { Language, Booking, UserRole } from '../types';
import { translations } from '../constants';

interface DailySummaryProps {
  selectedDate: Date;
  language: Language;
  checkIns: Booking[];
  checkOuts: Booking[];
  staying: Booking[];
  onEditBooking: (booking: Booking) => void;
  onDateChange: (date: string) => void;
  userRole: UserRole | null;
}

const SummarySection: React.FC<{ title: string; count: number; bookings: Booking[]; onEditBooking: (booking: Booking) => void; language: Language; userRole: UserRole | null; }> = ({ title, count, bookings, onEditBooking, language, userRole }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
        <h3 className="text-base sm:text-lg font-semibold text-text-dark">{title}</h3>
        <span className="bg-primary-yellow text-white text-sm font-bold px-2 py-1 rounded-full">{count}</span>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2">
          {bookings.length === 0 ? (
            <p className="text-text-light italic">{translations[language].noActivity}</p>
          ) : (
            bookings.map(booking => (
              <div 
                key={booking.booking_id} 
                onClick={() => userRole === 'admin' && onEditBooking(booking)} 
                className={`p-3 bg-gray-50 rounded-md ${userRole === 'admin' ? 'cursor-pointer hover:bg-yellow-50 transition-colors' : 'cursor-default'}`}
              >
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

const DailySummary: React.FC<DailySummaryProps> = ({ selectedDate, language, checkIns, checkOuts, staying, onEditBooking, onDateChange, userRole }) => {
  const t = translations[language];
  // Add timeZone: 'UTC' to ensure the displayed date matches the selected UTC date, regardless of user's local timezone.
  const formattedDate = selectedDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  // Helper to format date for the input[type=date], using UTC methods.
  const formatDateForInput = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full border-t-2 border-gray-200 mt-8 pt-8">
        <div className="flex flex-wrap items-baseline justify-start mb-4 gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-text-dark">Summary for {formattedDate}</h2>
            <input 
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                aria-label="Select a date for the summary"
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummarySection title={t.checkIns} count={checkIns.length} bookings={checkIns} onEditBooking={onEditBooking} language={language} userRole={userRole}/>
            <SummarySection title={t.checkOuts} count={checkOuts.length} bookings={checkOuts} onEditBooking={onEditBooking} language={language} userRole={userRole}/>
            <SummarySection title={t.staying} count={staying.length} bookings={staying} onEditBooking={onEditBooking} language={language} userRole={userRole}/>
        </div>
    </div>
  );
};

export default DailySummary;