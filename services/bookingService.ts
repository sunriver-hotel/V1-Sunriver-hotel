import type { Room, Booking } from '../types';

/**
 * Fetches all rooms from the API.
 */
export const getRooms = async (): Promise<Room[]> => {
  try {
    const response = await fetch('/api/rooms');
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    return await response.json();
  } catch (error) {
    console.error('API call to getRooms failed:', error);
    throw error;
  }
};

/**
 * Fetches bookings for a specific month and year from the API.
 * @param year The full year (e.g., 2024).
 * @param month The month (0-indexed, 0 for January).
 */
export const getBookingsForMonth = async (year: number, month: number): Promise<Booking[]> => {
    try {
        const response = await fetch(`/api/bookings?year=${year}&month=${month + 1}`);
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }
        return await response.json();
    } catch (error) {
        console.error('API call to getBookingsForMonth failed:', error);
        throw error;
    }
};

/**
 * Creates or updates a booking.
 * @param bookingData The booking data to save.
 */
export const saveBooking = async (bookingData: Partial<Booking>): Promise<Booking> => {
  const isEditing = !!bookingData.booking_id;
  const url = '/api/bookings';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save booking');
    }
    return await response.json();
  } catch (error) {
    console.error('API call to saveBooking failed:', error);
    throw error;
  }
};