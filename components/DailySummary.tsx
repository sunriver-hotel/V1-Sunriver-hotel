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

const DailySummary: React.FC<DailySummaryProps> = ({ selectedDate, language, checkIns, checkOuts, staying, onEditBooking }) => {
  const t = translations[language];
  const formattedDate = selectedDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full">
        <h2 className="text-xl font-bold text-text-dark mb-2">Summary for {formattedDate}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummarySection title={t.checkIns} count={checkIns.length} bookings={checkIns} onEditBooking={onEditBooking} language={language} />
            <SummarySection title={t.checkOuts} count={checkOuts.length} bookings={checkOuts} onEditBooking={onEditBooking} language={language}/>
            <SummarySection title={t.staying} count={staying.length} bookings={staying} onEditBooking={onEditBooking} language={language}/>
        </div>
    </div>
  );
};

export default DailySummary;
