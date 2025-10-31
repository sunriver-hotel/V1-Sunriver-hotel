import React, { useState, useEffect, useMemo } from 'react';
import type { Language, Booking } from '../types';
import { translations } from '../constants';
import Calendar from './Calendar';
import { getMockBookings } from '../services/bookingService';

interface DashboardPageProps {
  onLogout: () => void;
  language: Language;
}

const TOTAL_ROOMS = 24;

const DashboardPage: React.FC<DashboardPageProps> = ({ onLogout, language }) => {
  const t = translations[language];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch bookings for the current month from your API
    // GET /api/bookings?month=...&year=...
    setIsLoading(true);
    const mockBookings = getMockBookings(currentDate.getFullYear(), currentDate.getMonth());
    setBookings(mockBookings);
    setIsLoading(false);
  }, [currentDate]);

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const occupancyMap = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach(booking => {
        let current = new Date(booking.checkInDate);
        const end = new Date(booking.checkOutDate);
        while (current < end) {
            const dateString = current.toISOString().split('T')[0];
            map.set(dateString, (map.get(dateString) || 0) + 1);
            current.setDate(current.getDate() + 1);
        }
    });
    return map;
  }, [bookings]);

  return (
    <div className="w-full h-screen bg-pastel-bg p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark mb-4 md:mb-0">
          {t.dashboardTitle}
        </h1>
        <div className="flex items-center space-x-2">
            <span className="text-sm text-text-light">{t.totalRooms}: {TOTAL_ROOMS}</span>
            <button
                onClick={onLogout}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-yellow"
            >
                {t.logoutButton}
            </button>
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <button onClick={goToPrevMonth} className="p-2 rounded-full hover:bg-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToToday} className="px-4 py-2 rounded-md text-sm font-medium text-text-dark bg-gray-200 hover:bg-gray-300 transition">{t.today}</button>
          <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <h2 className="text-xl font-semibold text-text-dark">
          {t.months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
      </div>

      {/* Main Content */}
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <p>{t.loggingIn}</p>
          </div>
        ) : (
          <Calendar 
            currentDate={currentDate} 
            language={language}
            occupancyMap={occupancyMap}
            totalRooms={TOTAL_ROOMS}
          />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
