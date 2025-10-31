import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import RoomStatusPage from './components/RoomStatusPage';
import StatisticsPage from './components/StatisticsPage';
import CleaningStatusPage from './components/CleaningStatusPage';
import Navbar from './components/Navbar';
import BookingModal from './components/BookingModal';
import type { Language, Page, Booking, Room, CleaningStatus } from './types';
import { getRooms, getBookingsForMonth, saveBooking, deleteBooking, getCleaningStatuses, updateCleaningStatus } from './services/bookingService';

function App() {
  // Auth & Language State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState<Language>('th');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Global Data State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date()); // For calendar view
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cleaningStatuses, setCleaningStatuses] = useState<CleaningStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{ checkInDate?: string; roomIds?: number[] }>({});

  // Load logo from localStorage on initial render
  useEffect(() => {
    const savedLogo = localStorage.getItem('hotelLogo');
    if (savedLogo) {
      setLogoSrc(savedLogo);
    }
  }, []);

  // Data Fetching Logic
  const fetchDashboardData = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch rooms only once, if not already fetched
      const roomsPromise = rooms.length > 0 ? Promise.resolve(rooms) : getRooms();
      const bookingsPromise = getBookingsForMonth(date.getFullYear(), date.getMonth());
      
      const [roomsResult, bookingsResult] = await Promise.all([roomsPromise, bookingsPromise]);
      
      if (rooms.length === 0) {
        setRooms(roomsResult);
      }
      setBookings(bookingsResult);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [rooms]); // Only re-create if rooms array itself changes

  const fetchCleaningStatuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        if (rooms.length === 0) {
            const roomsResult = await getRooms();
            setRooms(roomsResult);
        }
        const statuses = await getCleaningStatuses();
        setCleaningStatuses(statuses);
    } catch (err) {
        setError('Failed to load cleaning status data.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [rooms.length]);

  useEffect(() => {
    if (isLoggedIn) {
        if (currentPage === 'cleaning') {
            fetchCleaningStatuses();
        } else {
            fetchDashboardData(currentMonthDate);
        }
    }
  }, [isLoggedIn, currentMonthDate, fetchDashboardData, currentPage, fetchCleaningStatuses]);


  // Event Handlers
  const handleLoginSuccess = () => setIsLoggedIn(true);
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard'); // Reset to default page on logout
  };

  const handleLogoUpload = (logoDataUrl: string) => {
    localStorage.setItem('hotelLogo', logoDataUrl);
    setLogoSrc(logoDataUrl);
  };

  const handleOpenNewBookingModal = (checkInDate?: string, roomIds?: number[]) => {
    setEditingBooking(null);
    setModalDefaults({ checkInDate, roomIds });
    setIsModalOpen(true);
  };
  
  const handleOpenEditBookingModal = (booking: Booking) => {
    setEditingBooking(booking);
    setModalDefaults({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
    setModalDefaults({});
  };

  const handleSaveBooking = async (bookingData: Omit<Partial<Booking>, 'room_id' | 'booking_id'>, roomIds: number[]) => {
    try {
      let payload;
      if (editingBooking) {
        payload = {
          ...bookingData,
          booking_id: editingBooking.booking_id,
          room_id: roomIds[0],
        };
      } else {
        payload = {
          ...bookingData,
          room_ids: roomIds,
        };
      }
      await saveBooking(payload);
      handleCloseModal();
      // Refetch data for the currently viewed month
      fetchDashboardData(currentMonthDate);
    } catch (err: any) {
      alert(`Error saving booking(s): ${err.message}`);
      throw err;
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
      handleCloseModal();
      fetchDashboardData(currentMonthDate);
    } catch (err: any) {
      alert(`Error deleting booking: ${err.message}`);
      throw err;
    }
  };
  
  const handleUpdateCleaningStatus = async (roomId: number, status: 'Clean' | 'Needs Cleaning') => {
      try {
        await updateCleaningStatus(roomId, status);
        // Refresh the list after update
        fetchCleaningStatuses();
      } catch (err: any) {
        alert(`Error updating cleaning status: ${err.message}`);
      }
  };

  const MainContent = () => (
    <div className="bg-pastel-bg w-full min-h-screen font-sans">
      <Navbar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        language={language}
        logoSrc={logoSrc}
        onLogoUpload={handleLogoUpload}
      />
      <div className="p-4 md:p-6 lg:p-8">
        {currentPage === 'dashboard' && (
          <Dashboard
            language={language}
            rooms={rooms}
            bookings={bookings}
            isLoading={isLoading}
            error={error}
            currentMonthDate={currentMonthDate}
            setCurrentMonthDate={setCurrentMonthDate}
            onAddBooking={handleOpenNewBookingModal}
            onEditBooking={handleOpenEditBookingModal}
          />
        )}
        {currentPage === 'room-status' && (
           <RoomStatusPage
            language={language}
            rooms={rooms}
            bookings={bookings}
            onBookRoom={handleOpenNewBookingModal}
            onEditBooking={handleOpenEditBookingModal}
           />
        )}
        {currentPage === 'statistics' && (
           <StatisticsPage
            language={language}
            rooms={rooms}
            bookings={bookings}
           />
        )}
        {currentPage === 'cleaning' && (
            <CleaningStatusPage
                language={language}
                rooms={rooms}
                bookings={bookings}
                cleaningStatuses={cleaningStatuses}
                onUpdateStatus={handleUpdateCleaningStatus}
                isLoading={isLoading}
                error={error}
            />
        )}
      </div>
      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveBooking}
          onDelete={handleDeleteBooking}
          language={language}
          rooms={rooms}
          existingBooking={editingBooking}
          bookings={bookings} // Pass all bookings for conflict checking
          defaultCheckInDate={modalDefaults.checkInDate}
          preSelectedRoomIds={modalDefaults.roomIds}
        />
      )}
    </div>
  );

  return (
    <>
      {!isLoggedIn ? (
        <div className="bg-pastel-bg min-h-screen w-full flex items-center justify-center font-sans">
            <LoginPage 
              onLoginSuccess={handleLoginSuccess} 
              language={language}
              setLanguage={setLanguage}
              logoSrc={logoSrc}
              onLogoUpload={handleLogoUpload}
            />
        </div>
      ) : (
        <MainContent />
      )}
    </>
  );
}

export default App;