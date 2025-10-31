import React from 'react';
import type { Language, Booking } from '../types';
import { translations } from '../constants';

interface ReceiptPageProps {
    language: Language;
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
}

const ReceiptPage: React.FC<ReceiptPageProps> = ({ language, bookings, isLoading, error }) => {
    const t = translations[language];

    if (isLoading) {
        return <div className="text-center p-8">{t.loadingBookings}</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600">{error}</div>;
    }

    // The API already sorts by most recent, so we just take the first 10.
    const recentBookings = bookings.slice(0, 10);

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{t.latestBookings}</h1>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="space-y-2">
                    {recentBookings.length > 0 ? (
                        recentBookings.map(booking => (
                            <div key={booking.booking_id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-md">
                                <div className="flex-grow">
                                    <p className="font-semibold">
                                        {booking.customer?.customer_name || 'N/A'} - 
                                        <span className="font-normal text-text-light"> Room {booking.room?.room_number || 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">{booking.booking_id} | {booking.customer?.phone || 'N/A'}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-semibold">฿{booking.price_per_night.toFixed(2)}</p>
                                    <p className="text-sm text-gray-500">{booking.check_in_date}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-text-light italic">{t.noBookingsFound}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptPage;