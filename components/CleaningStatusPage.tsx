import React, { useMemo } from 'react';
import type { Language, Room, Booking, CleaningStatus, RoomStatusDetail } from '../types';
import { translations } from '../constants';

interface CleaningStatusPageProps {
    language: Language;
    rooms: Room[];
    bookings: Booking[];
    cleaningStatuses: CleaningStatus[];
    onUpdateStatus: (roomId: number, status: 'Clean' | 'Needs Cleaning') => void;
    isLoading: boolean;
    error: string | null;
}

interface CombinedRoomInfo {
    room: Room;
    occupancy: RoomStatusDetail;
    cleaning: CleaningStatus | undefined;
}

const CleaningStatusPage: React.FC<CleaningStatusPageProps> = ({ language, rooms, bookings, cleaningStatuses, onUpdateStatus, isLoading, error }) => {
    const t = translations[language];
    
    const combinedRoomData = useMemo<CombinedRoomInfo[]>(() => {
        if (rooms.length === 0) return [];
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTime = new Date(todayStr + 'T00:00:00Z').getTime();
        
        const cleaningStatusMap = new Map(cleaningStatuses.map(cs => [cs.room_id, cs]));

        return rooms.map(room => {
            const bookingsForRoomToday = bookings.filter(b => b.room_id === room.room_id);
            const checkingOutBooking = bookingsForRoomToday.find(b => b.check_out_date === todayStr);
            const stayingBooking = bookingsForRoomToday.find(b => {
                const checkInTime = new Date(b.check_in_date + 'T00:00:00Z').getTime();
                const checkOutTime = new Date(b.check_out_date + 'T00:00:00Z').getTime();
                return todayTime >= checkInTime && todayTime < checkOutTime;
            });
            
            let occupancyStatus: RoomStatusDetail['status'] = 'Vacant';
            if (stayingBooking && checkingOutBooking) {
                occupancyStatus = 'Check-out / Check-in';
            } else if (stayingBooking) {
                occupancyStatus = stayingBooking.check_in_date === todayStr ? 'Check-in' : 'Occupied';
            } else if (checkingOutBooking) {
                occupancyStatus = 'Check-out';
            }

            return {
                room,
                occupancy: {
                    room,
                    status: occupancyStatus,
                    checkingOutBooking,
                    stayingBooking,
                },
                cleaning: cleaningStatusMap.get(room.room_id),
            };
        }).sort((a,b) => a.room.room_number.localeCompare(b.room.room_number, undefined, { numeric: true }));

    }, [rooms, bookings, cleaningStatuses]);

    const handleUpdateClick = (roomId: number, currentStatus: 'Clean' | 'Needs Cleaning' | undefined) => {
        if (currentStatus === 'Needs Cleaning') {
            if(window.confirm(t.confirmCleanMessage)) {
                onUpdateStatus(roomId, 'Clean');
            }
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">{t.loadingStatuses}</div>
    }

    if (error) {
        return <div className="text-center p-8 text-red-600">{error}</div>
    }

    const getCleaningColors = (status: 'Clean' | 'Needs Cleaning' | undefined) => {
        if (status === 'Clean') {
            return { cardBg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800' };
        }
        if (status === 'Needs Cleaning') {
            return { cardBg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800' };
        }
        return { cardBg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-500' };
    };
    
    const occupancyStatusKeyMap = {
        'Vacant': 'statusVacant',
        'Occupied': 'statusOccupied',
        'Check-in': 'statusCheckIn',
        'Check-out': 'statusCheckOut',
        'Check-out / Check-in': 'statusTurnover'
    };

    return (
        <div className="w-full h-full flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark mb-6">{t.cleaningStatusTitle}</h1>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {combinedRoomData.map(data => {
                    const cleaningStatus = data.cleaning?.status;
                    const colors = getCleaningColors(cleaningStatus);
                    const isClickable = cleaningStatus === 'Needs Cleaning';
                    
                    const occupancyText = t[occupancyStatusKeyMap[data.occupancy.status]];

                    return (
                        <div
                            key={data.room.room_id}
                            onClick={() => handleUpdateClick(data.room.room_id, cleaningStatus)}
                            className={`p-4 rounded-lg shadow-sm border-l-4 ${colors.border} ${colors.cardBg}
                                ${isClickable ? 'cursor-pointer transition-transform transform hover:scale-105 hover:shadow-md' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-text-dark">{data.room.room_number}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full text-center ${colors.text}`}>
                                    {cleaningStatus === 'Clean' ? t.cleaned : t.needsCleaning}
                                </span>
                            </div>
                            <p className="text-sm text-text-light mt-1">{data.room.room_type}</p>
                            
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 font-semibold mb-1">Occupancy: {occupancyText}</p>
                                {data.occupancy.checkingOutBooking && (
                                    <p className="text-xs text-orange-600 truncate">
                                        <span className="font-bold">Out:</span> {data.occupancy.checkingOutBooking.customer?.customer_name}
                                    </p>
                                )}
                                {data.occupancy.stayingBooking && (
                                    <p className="text-xs text-blue-600 truncate">
                                        <span className="font-bold">In:</span> {data.occupancy.stayingBooking.customer?.customer_name}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CleaningStatusPage;
