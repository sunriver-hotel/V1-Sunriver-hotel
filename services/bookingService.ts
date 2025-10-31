import type { Room, Booking, CleaningStatus } from '../types';

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
 * Creates or updates a booking. The payload shape differs for create vs. update.
 * For create, it expects `room_ids` array. For update, it expects a single `room_id`.
 * @param bookingData The booking data to save.
 */
export const saveBooking = async (bookingData: any): Promise<Booking | Booking[]> => {
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
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(errorData.message || 'Failed to save booking');
    }
    return await response.json();
  } catch (error) {
    console.error('API call to saveBooking failed:', error);
    throw error;
  }
};

/**
 * Deletes a booking by its ID.
 * @param bookingId The ID of the booking to delete.
 */
export const deleteBooking = async (bookingId: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch('/api/bookings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(errorData.message || 'Failed to delete booking');
    }
    return await response.json();
  } catch (error) {
    console.error('API call to deleteBooking failed:', error);
    throw error;
  }
};

/**
 * Fetches all cleaning statuses from the API.
 * This endpoint also triggers the auto-update logic on the backend.
 */
export const getCleaningStatuses = async (): Promise<CleaningStatus[]> => {
  try {
    const response = await fetch('/api/cleaning');
    if (!response.ok) {
      throw new Error('Failed to fetch cleaning statuses');
    }
    return await response.json();
  } catch (error) {
    console.error('API call to getCleaningStatuses failed:', error);
    throw error;
  }
};

/**
 * Updates the cleaning status for a specific room.
 * @param roomId The ID of the room to update.
 * @param status The new status ('Clean' or 'Needs Cleaning').
 */
export const updateCleaningStatus = async (roomId: number, status: 'Clean' | 'Needs Cleaning'): Promise<CleaningStatus> => {
  try {
    const response = await fetch('/api/cleaning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(errorData.message || 'Failed to update cleaning status');
    }
    return await response.json();
  } catch (error) {
    console.error('API call to updateCleaningStatus failed:', error);
    throw error;
  }
};
