import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Language, Booking, Room } from '../types';
import { translations } from '../constants';
import Calendar from './Calendar';
import DailySummary from './DailySummary';
import BookingModal from './BookingModal';
import { getRooms, getBookingsForMonth, saveBooking } from '../services/bookingService';

interface DashboardProps {
  onLogout: () => void;
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, language }) => {
  const t = translations[language];
  
  // State Management
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Data Fetching
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const roomsData = getRooms();
      const bookingsData = getBookingsForMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth());
      const [roomsResult, bookingsResult] = await Promise.all([roomsData, bookingsData]);
      setRooms(roomsResult);
      setBookings(bookingsResult);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonthDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calendar Navigation
  const goToNextMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToPrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    today.setHours(0,0,0,0);
    setSelectedDate(today);
  };
  
  // Occupancy Calculation
  const occupancyMap = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach(booking => {
        // Parse date strings as UTC to avoid timezone issues.
        const [inYear, inMonth, inDay] = booking.check_in_date.split('-').map(Number);
        const [outYear, outMonth, outDay] = booking.check_out_date.split('-').map(Number);
        
        // Create Date objects in UTC. Note: month is 0-indexed for Date.UTC.
        let current = new Date(Date.UTC(inYear, inMonth - 1, inDay));
        const end = new Date(Date.UTC(outYear, outMonth - 1, outDay));

        while (current < end) {
            // toISOString() will correctly format the date part because the Date object is in UTC.
            const dateString = current.toISOString().split('T')[0];
            map.set(dateString, (map.get(dateString) || 0) + 1);
            // Increment the day using UTC methods.
            current.setUTCDate(current.getUTCDate() + 1);
        }
    });
    return map;
  }, [bookings]);

  // Daily Summary Data Filtering
  const { checkIns, checkOuts, staying } = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const checkIns = bookings.filter(b => b.check_in_date === dateStr);
    const checkOuts = bookings.filter(b => b.check_out_date === dateStr);
    const staying = bookings.filter(b => {
      // Use UTC for comparison to match occupancyMap logic
      const checkIn = new Date(Date.UTC(
          parseInt(b.check_in_date.substring(0,4)),
          parseInt(b.check_in_date.substring(5,7)) - 1,
          parseInt(b.check_in_date.substring(8,10))
      )).getTime();
       const checkOut = new Date(Date.UTC(
          parseInt(b.check_out_date.substring(0,4)),
          parseInt(b.check_out_date.substring(5,7)) - 1,
          parseInt(b.check_out_date.substring(8,10))
      )).getTime();
      const selected = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())).getTime();
      return selected >= checkIn && selected < checkOut;
    });
    return { checkIns, checkOuts, staying };
  }, [bookings, selectedDate]);
  
  // Modal Handling
  const handleAddBooking = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  const handleSaveBooking = async (bookingData: Partial<Booking>) => {
    try {
      await saveBooking(bookingData);
      handleCloseModal();
      fetchDashboardData(); // Re-fetch data to show updates
    } catch (err: any) {
      alert(`Error saving booking: ${err.message}`);
    }
  };

  return (
    <div className="w-full h-screen bg-pastel-bg p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark mb-4 md:mb-0">
          <i className="fas fa-home mr-2"></i>{t.dashboardTitle}
        </h1>
        <div className="flex items-center space-x-4">
            <button
                onClick={handleAddBooking}
                className="py-2 px-4 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
                {t.addBooking}
            </button>
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
            &lt;
          </button>
          <button onClick={goToToday} className="px-4 py-2 rounded-md text-sm font-medium text-text-dark bg-gray-200 hover:bg-gray-300 transition">{t.today}</button>
          <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition">
            &gt;
          </button>
        </div>
        <h2 className="text-xl font-semibold text-text-dark">
          {t.months[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
        </h2>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col gap-6 overflow-y-auto">
        <div className="flex-grow min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><p>{t.loadingBookings}</p></div>
          ) : error ? (
            <div className="flex justify-center items-center h-full"><p className="text-red-500">{error}</p></div>
          ) : (
            <Calendar 
              currentDate={currentMonthDate} 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              language={language}
              occupancyMap={occupancyMap}
              totalRooms={rooms.length}
            />
          )}
        </div>
        <DailySummary 
            selectedDate={selectedDate}
            language={language}
            checkIns={checkIns}
            checkOuts={checkOuts}
            staying={staying}
            onEditBooking={handleEditBooking}
        />
      </main>

      {isModalOpen && (
        <BookingModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveBooking}
            language={language}
            rooms={rooms}
            existingBooking={editingBooking}
            bookings={bookings}
        />
      )}
    </div>
  );
};

export default Dashboard;