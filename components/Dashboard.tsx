import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Language, Booking, Room } from '../types';
import { translations } from '../constants';
import Calendar from './Calendar';
import DailySummary from './DailySummary';
import BookingModal from './BookingModal';
import { getRooms, getBookingsForMonth, saveBooking, deleteBooking } from '../services/bookingService';

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
    // Use UTC for all date state management to prevent timezone issues.
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  });
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [defaultCheckInDate, setDefaultCheckInDate] = useState<string | null>(null);

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
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    setCurrentMonthDate(new Date()); // Reset calendar view to current month
    setSelectedDate(todayUTC);
  };
    const handleSummaryDateChange = (dateString: string) => {
        // Input date string "YYYY-MM-DD" is timezone-agnostic. Treat it as UTC.
        const [year, month, day] = dateString.split('-').map(Number);
        const newDateUTC = new Date(Date.UTC(year, month - 1, day));
        setSelectedDate(newDateUTC);

        // Also update calendar view if month/year is different
        const localDateForView = new Date(year, month - 1, day);
        if (localDateForView.getFullYear() !== currentMonthDate.getFullYear() || localDateForView.getMonth() !== currentMonthDate.getMonth()) {
            setCurrentMonthDate(localDateForView);
        }
    };
  
  // Occupancy Calculation
  const occupancyMap = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach(booking => {
        const [inYear, inMonth, inDay] = booking.check_in_date.split('-').map(Number);
        const [outYear, outMonth, outDay] = booking.check_out_date.split('-').map(Number);
        
        let current = new Date(Date.UTC(inYear, inMonth - 1, inDay));
        const end = new Date(Date.UTC(outYear, outMonth - 1, outDay));

        while (current < end) {
            const dateString = current.toISOString().split('T')[0];
            map.set(dateString, (map.get(dateString) || 0) + 1);
            current.setUTCDate(current.getUTCDate() + 1);
        }
    });
    return map;
  }, [bookings]);

  // Daily Summary Data Filtering
  const { checkIns, checkOuts, staying } = useMemo(() => {
    // selectedDate is already in UTC. Format to YYYY-MM-DD string for comparison.
    const dateStr = selectedDate.toISOString().split('T')[0];
    const checkIns = bookings.filter(b => b.check_in_date === dateStr);
    const checkOuts = bookings.filter(b => b.check_out_date === dateStr);

    const selectedTime = selectedDate.getTime(); // UTC timestamp

    const staying = bookings.filter(b => {
      // Parse booking dates as UTC timestamps for accurate comparison
      const checkInTime = new Date(b.check_in_date + 'T00:00:00Z').getTime();
      const checkOutTime = new Date(b.check_out_date + 'T00:00:00Z').getTime();
      return selectedTime >= checkInTime && selectedTime < checkOutTime;
    });
    return { checkIns, checkOuts, staying };
  }, [bookings, selectedDate]);
  
  // Modal Handling
  const handleAddBooking = () => {
    setDefaultCheckInDate(null); // Use today's date in modal
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };
  
  const handleCalendarDateClick = (date: Date) => { // date is now UTC
    setSelectedDate(date);
    setDefaultCheckInDate(date.toISOString().split('T')[0]);
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
    setDefaultCheckInDate(null);
  };
  
  const handleSaveBooking = async (bookingData: Omit<Partial<Booking>, 'room_id' | 'booking_id'>, roomIds: number[]) => {
    try {
      let payload;
      if (editingBooking) {
        payload = {
          ...bookingData,
          booking_id: editingBooking.booking_id,
          room_id: roomIds[0], // Editing only supports one room
        };
      } else {
        payload = {
          ...bookingData,
          room_ids: roomIds,
        };
      }
      await saveBooking(payload);
      handleCloseModal();
      fetchDashboardData();
    } catch (err: any) {
      alert(`Error saving booking(s): ${err.message}`);
      throw err;
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
        await deleteBooking(bookingId);
        handleCloseModal();
        fetchDashboardData();
    } catch (err: any) {
        alert(`Error deleting booking: ${err.message}`);
        throw err;
    }
  };


  return (
    <div className="w-full h-screen bg-pastel-bg p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-text-dark mb-4 md:mb-0">
          <i className="fas fa-home mr-2"></i>{t.dashboardTitle}
        </h1>
        <div className="flex items-center flex-wrap justify-end gap-2 md:gap-4">
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
      <main className="flex-grow flex flex-col overflow-y-auto min-h-0">
        <div>
           {isLoading ? (
            <div className="flex justify-center items-center py-20"><p>{t.loadingBookings}</p></div>
          ) : error ? (
            <div className="flex justify-center items-center py-20"><p className="text-red-500">{error}</p></div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <Calendar 
                currentDate={currentMonthDate} 
                selectedDate={selectedDate}
                onDateSelect={handleCalendarDateClick}
                language={language}
                occupancyMap={occupancyMap}
                totalRooms={rooms.length}
              />
            </div>
          )}
        </div>
        <DailySummary 
            selectedDate={selectedDate}
            onDateChange={handleSummaryDateChange}
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
            onDelete={handleDeleteBooking}
            language={language}
            rooms={rooms}
            existingBooking={editingBooking}
            bookings={bookings}
            defaultCheckInDate={defaultCheckInDate}
        />
      )}
    </div>
  );
};

export default Dashboard;