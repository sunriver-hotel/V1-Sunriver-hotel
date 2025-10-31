import React, { useState, useMemo } from 'react';
import type { Language, Room, Booking, RoomType, BedType } from '../types';
import { translations } from '../constants';

// Helper function to format date correctly
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type SortByType = 'room_number' | 'room_type' | 'bed_type';

interface RoomStatus {
    room: Room;
    status: 'Vacant' | 'Occupied';
    booking: Booking | null;
}

interface RoomStatusPageProps {
    language: Language;
    rooms: Room[];
    bookings: Booking[];
    onBookRoom: (checkInDate: string, roomIds: number[]) => void;
    onEditBooking: (booking: Booking) => void;
}

const RoomStatusPage: React.FC<RoomStatusPageProps> = ({ language, rooms, bookings, onBookRoom, onEditBooking }) => {
    const t = translations[language];
    const [viewDate, setViewDate] = useState<string>(formatDateForInput(new Date()));
    const [sortBy, setSortBy] = useState<SortByType>('room_number');

    const roomStatuses = useMemo<RoomStatus[]>(() => {
        const viewDateTime = new Date(viewDate + 'T00:00:00Z').getTime();

        const occupiedRoomsMap = new Map<number, Booking>();
        bookings.forEach(booking => {
            const checkInTime = new Date(booking.check_in_date + 'T00:00:00Z').getTime();
            const checkOutTime = new Date(booking.check_out_date + 'T00:00:00Z').getTime();
            if (viewDateTime >= checkInTime && viewDateTime < checkOutTime) {
                occupiedRoomsMap.set(booking.room_id, booking);
            }
        });

        // FIX: Explicitly type the statuses array to ensure type compatibility with RoomStatus[].
        const statuses: RoomStatus[] = rooms.map(room => {
            const booking = occupiedRoomsMap.get(room.room_id) || null;
            return {
                room,
                status: booking ? 'Occupied' : 'Vacant',
                booking,
            };
        });
        
        // Sorting logic
        return statuses.sort((a, b) => {
            if (sortBy === 'room_number') {
                return a.room.room_number.localeCompare(b.room.room_number, undefined, { numeric: true });
            }
            if (sortBy === 'room_type') {
                const typeComparison = a.room.room_type.localeCompare(b.room.room_type);
                if (typeComparison !== 0) return typeComparison;
            }
            if (sortBy === 'bed_type') {
                const bedComparison = a.room.bed_type.localeCompare(b.room.bed_type);
                if (bedComparison !== 0) return bedComparison;
            }
            // Fallback sort by room number
            return a.room.room_number.localeCompare(b.room.room_number, undefined, { numeric: true });
        });

    }, [viewDate, rooms, bookings, sortBy]);

    const handleRoomClick = (status: RoomStatus) => {
        if (status.status === 'Vacant') {
            onBookRoom(viewDate, [status.room.room_id]);
        } else if (status.booking) {
            onEditBooking(status.booking);
        }
    };

    const getRoomColor = (roomType: RoomType): string => {
        switch (roomType) {
            case 'River view': return 'border-pastel-blue';
            case 'Standard view': return 'border-pastel-green';
            case 'Cottage': return 'border-pastel-purple';
            default: return 'border-gray-300';
        }
    };
    
    const SortButton: React.FC<{ value: SortByType, label: string }> = ({ value, label }) => {
        const isActive = sortBy === value;
        return (
            <button
                onClick={() => setSortBy(value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary-yellow text-white' : 'bg-white hover:bg-gray-100 text-text-dark'}`}
            >
                {label}
            </button>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <div>
                        <label htmlFor="status-date" className="block text-sm font-medium text-text-dark mb-1">{t.selectDate}</label>
                         <input
                            id="status-date"
                            type="date"
                            value={viewDate}
                            onChange={(e) => setViewDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                        />
                     </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-dark">{t.sortBy}</span>
                        <div className="flex items-center gap-2 rounded-lg p-1">
                            <SortButton value="room_number" label={t.sortByRoomNumber} />
                            <SortButton value="room_type" label={t.sortByRoomType} />
                            <SortButton value="bed_type" label={t.sortByBedType} />
                        </div>
                     </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {roomStatuses.map(status => (
                    <div 
                        key={status.room.room_id} 
                        onClick={() => handleRoomClick(status)}
                        className={`p-4 rounded-lg shadow-sm cursor-pointer transition-transform transform hover:scale-105 border-l-4 ${getRoomColor(status.room.room_type)}
                            ${status.status === 'Vacant' ? 'bg-white' : 'bg-yellow-50'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                             <h3 className="text-lg font-bold text-text-dark">{status.room.room_number}</h3>
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.status === 'Vacant' ? 'bg-green-100 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                {status.status === 'Vacant' ? t.statusVacant : t.statusOccupied}
                             </span>
                        </div>
                        <p className="text-sm text-text-light mt-1">{status.room.room_type}</p>
                        <p className="text-xs text-gray-500">{status.room.bed_type}</p>
                        {status.booking && status.booking.customer && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium truncate">{status.booking.customer.customer_name}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomStatusPage;