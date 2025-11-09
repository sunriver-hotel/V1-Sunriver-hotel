import React, { useMemo, useState } from 'react';
import type { Language, Booking, Room, UserRole } from '../types';
import { translations } from '../constants';
import Calendar from './Calendar';
import DailySummary from './DailySummary';
import { getBookingsForRange } from '../services/bookingService';


interface DashboardProps {
  language: Language;
  rooms: Room[];
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  currentMonthDate: Date;
  setCurrentMonthDate: React.Dispatch<React.SetStateAction<Date>>;
  onAddBooking: (checkInDate?: string) => void;
  onEditBooking: (booking: Booking) => void;
  userRole: UserRole | null;
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
  userRole,
}) => {
  const t = translations[language];
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  });

  // State for Export feature
  const [exportStartDate, setExportStartDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  
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
  
  const handleCalendarDateClick = (date: Date) => { // date is UTC
    setSelectedDate(date); // Update the summary view
    
    // Only admins can add bookings
    if (userRole === 'admin') {
      const dateString = date.toISOString().split('T')[0]; // Format for modal
      onAddBooking(dateString); // Trigger modal with selected date
    }
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const bookingsForExport = await getBookingsForRange(exportStartDate, exportEndDate);

      if (bookingsForExport.length === 0) {
        alert("No bookings found for the selected date range.");
        return;
      }
      
      const headers = ["ลำดับที่", "Booking ID", "ชื่อลูกค้า", "เบอร์โทรลูกค้า", "Check in date", "Check out date", "ราคาต่อคืน"];
      const csvRows = [headers.join(',')];

      bookingsForExport.forEach((booking, index) => {
        // Sanitize data for CSV: enclose in quotes to handle commas, newlines.
        const sanitize = (str: string | undefined | null) => `"${(str || '').replace(/"/g, '""')}"`;

        const row = [
          index + 1,
          booking.booking_id,
          sanitize(booking.customer?.customer_name),
          booking.customer?.phone || '',
          booking.check_in_date,
          booking.check_out_date,
          booking.price_per_night,
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bookings_${exportStartDate}_to_${exportEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
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
              <div className="min-w-[350px]">
                <Calendar 
                  currentDate={currentMonthDate} 
                  selectedDate={selectedDate}
                  onDateSelect={handleCalendarDateClick}
                  language={language}
                  occupancyMap={occupancyMap}
                  totalRooms={rooms.length}
                />
              </div>
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
            userRole={userRole}
        />

        {/* Export Section */}
        <div className="w-full border-t-2 border-gray-200 mt-8 pt-8">
            <h2 className="text-xl font-bold text-text-dark mb-4">{t.exportTitle}</h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-text-dark">{t.startDate}</label>
                        <input
                        id="start-date"
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-text-dark">{t.endDate}</label>
                        <input
                        id="end-date"
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                        />
                    </div>
                     <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90 disabled:bg-yellow-300"
                    >
                        {isExporting ? t.exporting : t.exportButton}
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;