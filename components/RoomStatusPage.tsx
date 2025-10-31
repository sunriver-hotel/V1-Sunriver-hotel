import React, { useState, useMemo } from 'react';
import type { Language, Room, Booking, RoomType, RoomStatusDetail, RoomStatusType } from '../types';
import { translations } from '../constants';

// Helper function to format date correctly
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type SortByType = 'room_number' | 'room_type' | 'bed_type';

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

    const roomStatuses = useMemo<RoomStatusDetail[]>(() => {
        const checkingOutMap = new Map<number, Booking>();
        const stayingMap = new Map<number, Booking>();
        const viewDateTime = new Date(viewDate + 'T00:00:00Z').getTime();

        bookings.forEach(booking => {
            const checkInTime = new Date(booking.check_in_date + 'T00:00:00Z').getTime();
            const checkOutTime = new Date(booking.check_out_date + 'T00:00:00Z').getTime();

            // Is a guest checking out today?
            if (booking.check_out_date === viewDate) {
                checkingOutMap.set(booking.room_id, booking);
            }

            // Is a guest staying today (which includes checking in)?
            if (viewDateTime >= checkInTime && viewDateTime < checkOutTime) {
                stayingMap.set(booking.room_id, booking);
            }
        });

        const statuses: RoomStatusDetail[] = rooms.map(room => {
            const checkingOutBooking = checkingOutMap.get(room.room_id);
            const stayingBooking = stayingMap.get(room.room_id);
            let status: RoomStatusType = 'Vacant';

            if (stayingBooking && checkingOutBooking) {
                status = 'Check-out / Check-in';
            } else if (stayingBooking) {
                if (stayingBooking.check_in_date === viewDate) {
                    status = 'Check-in';
                } else {
                    status = 'Occupied';
                }
            } else if (checkingOutBooking) {
                status = 'Check-out';
            }

            return {
                room,
                status,
                checkingOutBooking: checkingOutBooking || undefined,
                stayingBooking: stayingBooking || undefined,
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

    const handleRoomClick = (status: RoomStatusDetail) => {
        // A room with a check-out is available for a new booking on the same day.
        if (status.status === 'Vacant' || status.status === 'Check-out') {
            onBookRoom(viewDate, [status.room.room_id]);
        } 
        // If a guest is staying or checking in, edit their booking.
        else if (status.stayingBooking) {
            onEditBooking(status.stayingBooking);
        }
    };

    const getStatusColors = (status: RoomStatusType): { cardBg: string; badgeBg: string; text: string; border: string } => {
        switch (status) {
            case 'Vacant': return { cardBg: 'bg-white', badgeBg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' };
            case 'Check-in': return { cardBg: 'bg-blue-50', badgeBg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' };
            case 'Occupied': return { cardBg: 'bg-yellow-50', badgeBg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' };
            case 'Check-out': return { cardBg: 'bg-orange-50', badgeBg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-400' };
            case 'Check-out / Check-in': return { cardBg: 'bg-purple-50', badgeBg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' };
            default: return { cardBg: 'bg-gray-50', badgeBg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-400' };
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

    // FIX: Removed the overly broad type annotation to allow TypeScript to infer a more specific type.
    // This fixes the error where `statusText` was inferred as a type that included objects, which are not valid React nodes.
    const statusKeyMap = {
        'Vacant': 'statusVacant',
        'Occupied': 'statusOccupied',
        'Check-in': 'statusCheckIn',
        'Check-out': 'statusCheckOut',
        'Check-out / Check-in': 'statusTurnover'
    };

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
                {roomStatuses.map(status => {
                    const colors = getStatusColors(status.status);
                    const statusText = t[statusKeyMap[status.status]];

                    return (
                        <div 
                            key={status.room.room_id} 
                            onClick={() => handleRoomClick(status)}
                            className={`p-4 rounded-lg shadow-sm cursor-pointer transition-transform transform hover:scale-105 border-l-4 ${colors.border} ${colors.cardBg}`}
                        >
                            <div className="flex justify-between items-start">
                                 <h3 className="text-lg font-bold text-text-dark">{status.room.room_number}</h3>
                                 <span className={`px-2 py-1 text-xs font-semibold rounded-full text-center ${colors.badgeBg} ${colors.text}`}>
                                    {statusText}
                                 </span>
                            </div>
                            <p className="text-sm text-text-light mt-1">{status.room.room_type}</p>
                            <p className="text-xs text-gray-500">{status.room.bed_type}</p>
                            
                            {(status.checkingOutBooking || status.stayingBooking) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                    {status.checkingOutBooking?.customer && (
                                        <div>
                                            <span className="text-xs text-orange-600 font-semibold">{t.checkOuts}: </span>
                                            <p className="text-sm font-medium truncate">{status.checkingOutBooking.customer.customer_name}</p>
                                        </div>
                                    )}
                                    {status.stayingBooking?.customer && (
                                         <div>
                                            <span className="text-xs text-blue-600 font-semibold">
                                                {status.status === 'Check-in' || status.status === 'Check-out / Check-in' ? t.checkIns : t.staying}:
                                            </span>
                                            <p className="text-sm font-medium truncate">{status.stayingBooking.customer.customer_name}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoomStatusPage;