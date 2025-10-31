import React, { useState, useMemo } from 'react';
import type { Language, Booking } from '../types';
import { translations } from '../constants';
import ReceiptTemplate from './ReceiptTemplate';

interface ReceiptPageProps {
    language: Language;
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
    logoSrc: string | null;
}

const ReceiptPage: React.FC<ReceiptPageProps> = ({ language, bookings, isLoading, error, logoSrc }) => {
    const t = translations[language];
    
    // State for user interaction
    const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
    const [isReceiptVisible, setIsReceiptVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const handleSelectBooking = (bookingId: string) => {
        setSelectedBookingIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookingId)) {
                newSet.delete(bookingId);
            } else {
                newSet.add(bookingId);
            }
            return newSet;
        });
    };

    const selectedBookings = useMemo(() => {
        return bookings.filter(b => selectedBookingIds.has(b.booking_id));
    }, [bookings, selectedBookingIds]);

    const handleCreateReceipt = () => {
        if (selectedBookings.length > 0) {
            setIsReceiptVisible(true);
        } else {
            alert(t.pleaseSelectBookings);
        }
    };

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
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{t.receiptTitle}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Booking List */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">{t.latestBookings}</h2>
                    <div className="space-y-2">
                        {recentBookings.length > 0 ? (
                            recentBookings.map(booking => (
                                <div key={booking.booking_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                                    <input
                                        type="checkbox"
                                        checked={selectedBookingIds.has(booking.booking_id)}
                                        onChange={() => handleSelectBooking(booking.booking_id)}
                                        className="h-5 w-5 rounded border-gray-300 text-primary-yellow focus:ring-primary-yellow"
                                    />
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

                {/* Right Side: Payment Details */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-lg font-semibold mb-4">{t.paymentDetails}</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-dark">{t.paymentMethod}</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                            >
                                <option value="Cash">{t.cash}</option>
                                <option value="Transfer">{t.transfer}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark">{t.paymentDate}</label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
                            />
                        </div>
                        <button
                            onClick={handleCreateReceipt}
                            disabled={selectedBookingIds.size === 0}
                            className="w-full py-2 px-4 bg-primary-yellow text-white font-semibold rounded-md shadow-sm hover:bg-opacity-90 disabled:bg-yellow-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {t.createReceipt}
                        </button>
                    </div>
                </div>
            </div>

            {isReceiptVisible && (
                <ReceiptTemplate
                    isOpen={isReceiptVisible}
                    onClose={() => setIsReceiptVisible(false)}
                    bookings={selectedBookings}
                    logoSrc={logoSrc}
                    language={language}
                    paymentMethod={paymentMethod}
                    paymentDate={paymentDate}
                />
            )}
        </div>
    );
};

export default ReceiptPage;