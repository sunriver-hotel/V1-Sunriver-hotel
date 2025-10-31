import React, { useMemo } from 'react';
import type { Language, Booking, Room } from '../types';
import { translations } from '../constants';
import Calendar from './Calendar';
import DailySummary from './DailySummary';

interface DashboardProps {
  language: Language;
  rooms: Room[];
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  currentMonthDate: Date;
  // FIX: Updated type to allow updater functions for state, resolving incorrect type error.
  setCurrentMonthDate: React.Dispatch<React.SetStateAction<Date>>;
  onAddBooking: () => void;
  onEditBooking: (booking: Booking) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  language,
  rooms,
  bookings,
  isLoading,
  error,
  currentMonthDate,
  setCurrentMonthDate,
  onAddBooking,
  onEditBooking,
}) => {
  const t = translations[language];
  
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  });
  
  // Calendar Navigation
  const goToNextMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToPrevMonth = () => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToToday = () => {
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    setCurrentMonthDate(new Date());
    setSelectedDate(todayUTC);
  };
    const handleSummaryDateChange = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const newDateUTC = new Date(Date.UTC(year, month - 1, day));
        setSelectedDate(newDateUTC);

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
    const dateStr = selectedDate.toISOString().split('T')[0];
    const checkIns = bookings.filter(b => b.check_in_date === dateStr);
    const checkOuts = bookings.filter(b => b.check_out_date === dateStr);

    const selectedTime = selectedDate.getTime();

    const staying = bookings.filter(b => {
      const checkInTime = new Date(b.check_in_date + 'T00:00:00Z').getTime();
      const checkOutTime = new Date(b.check_out_date + 'T00:00:00Z').getTime();
      return selectedTime >= checkInTime && selectedTime < checkOutTime;
    });
    return { checkIns, checkOuts, staying };
  }, [bookings, selectedDate]);
  
  const handleCalendarDateClick = (date: Date) => { // date is now UTC
    setSelectedDate(date);
    onAddBooking(); // This will now be handled by App.tsx to open modal with defaults
  };


  return (
    <div className="w-full h-full flex flex-col">
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
                onDateSelect={setSelectedDate}
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
            onEditBooking={onEditBooking}
        />
      </main>
    </div>
  );
};

export default Dashboard;