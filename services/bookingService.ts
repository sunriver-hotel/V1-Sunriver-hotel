import type { Room, Booking, RoomType } from '../types';

const TOTAL_ROOMS = 24;
const roomTypes: RoomType[] = ['Single', 'Double', 'Suite'];

// Create a static list of 24 rooms
const rooms: Room[] = Array.from({ length: TOTAL_ROOMS }, (_, i) => {
    const roomNumber = (101 + i).toString();
    const type = roomTypes[i % roomTypes.length];
    return { id: i + 1, roomNumber, type };
});

export const getRooms = (): Room[] => {
    return rooms;
};

// Generates some mock bookings for a given month and year
export const getMockBookings = (year: number, month: number): Booking[] => {
    const bookings: Booking[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create a few random bookings to populate the calendar
    for (let i = 0; i < TOTAL_ROOMS * 0.8; i++) {
        const roomId = Math.floor(Math.random() * TOTAL_ROOMS) + 1;
        const checkInDay = Math.floor(Math.random() * (daysInMonth - 3)) + 1;
        const stayDuration = Math.floor(Math.random() * 5) + 1;
        const checkOutDay = checkInDay + stayDuration;
        
        if (checkOutDay > daysInMonth) continue;

        const checkInDate = new Date(year, month, checkInDay).toISOString().split('T')[0];
        const checkOutDate = new Date(year, month, checkOutDay).toISOString().split('T')[0];

        bookings.push({
            id: `booking-${year}-${month}-${i}`,
            roomId,
            guestName: `Guest ${i + 1}`,
            checkInDate,
            checkOutDate,
        });
    }

    // Add a guaranteed full day for demonstration
    const fullDay = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < TOTAL_ROOMS; i++) {
         const checkInDate = new Date(year, month, fullDay).toISOString().split('T')[0];
         const checkOutDate = new Date(year, month, fullDay + 1).toISOString().split('T')[0];
         bookings.push({
            id: `booking-full-${i}`,
            roomId: i + 1,
            guestName: `Full Day Guest ${i + 1}`,
            checkInDate,
            checkOutDate,
        });
    }


    return bookings;
};
