import React, { useState, useMemo, useEffect } from 'react';
import type { Language, Booking } from '../types';
import { translations } from '../constants';
import ReceiptTemplate from './ReceiptTemplate';

interface ReceiptPageProps {
    language: Language;
    logoSrc: string | null;
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
}

const ReceiptPage: React.FC<ReceiptPageProps> = ({ language, logoSrc, bookings, isLoading, error }) => {
    const t = translations[language];
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [showReceipt, setShowReceipt] = useState(false);
    
    // When bookings data changes (e.g., after a search), ensure selected IDs are still valid
    useEffect(() => {
        const availableIds = new Set(bookings.map(b => b.booking_id));
        setSelectedBookingIds(prev => prev.filter(id => availableIds.has(id)));
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase().trim();
        if (!lowercasedTerm) {
            // Sort by creation date to show the latest
            return [...bookings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);
        }
        return bookings.filter(b => 
            (b.customer?.customer_name?.toLowerCase().includes(lowercasedTerm)) ||
            (b.customer?.phone?.includes(lowercasedTerm)) ||
            (b.booking_id?.toLowerCase().includes(lowercasedTerm)) ||
            (b.check_in_date?.includes(lowercasedTerm))
        );
    }, [searchTerm, bookings]);

    const handleSelectBooking = (bookingId: string) => {
        setSelectedBookingIds(prev => {
            if (prev.includes(bookingId)) {
                return prev.filter(id => id !== bookingId);
            } else {
                return [...prev, bookingId]; // Preserve selection order
            }
        });
    };

    const handleCreateReceipt = () => {
        if (selectedBookingIds.length === 0) {
            alert(t.pleaseSelectBookings);
            return;
        }
        setShowReceipt(true);
    };

    const selectedBookings = useMemo(() => {
        if (selectedBookingIds.length === 0) return [];
        const bookingMap = new Map(bookings.map(b => [b.booking_id, b]));
        // Return bookings in the order they were selected
        return selectedBookingIds.map(id => bookingMap.get(id)).filter((b): b is Booking => !!b);
    }, [selectedBookingIds, bookings]);

    if (isLoading) {
        return <div className="text-center p-8">{t.loadingBookings}</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600">{error}</div>;
    }

    return (
        <div className="w-full h-full flex flex-col space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-dark">{t.receiptTitle}</h1>

            {/* Search and Selection */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                 <input
                    type="text"
                    placeholder={t.searchBookings}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-yellow focus:border-transparent transition"
                />
                 <h2 className="text-lg font-semibold text-text-dark mt-6 mb-2">
                    {searchTerm ? t.searchResults : t.latestBookings}
                 </h2>
                <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map(booking => (
                            <div key={booking.booking_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                                <input
                                    type="checkbox"
                                    id={`booking-${booking.booking_id}`}
                                    checked={selectedBookingIds.includes(booking.booking_id)}
                                    onChange={() => handleSelectBooking(booking.booking_id)}
                                    className="h-5 w-5 rounded border-gray-300 text-primary-yellow focus:ring-primary-yellow cursor-pointer"
                                />
                                <label htmlFor={`booking-${booking.booking_id}`} className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-4 cursor-pointer">
                                    <div>
                                        <p className="font-semibold">{booking.customer?.customer_name}</p>
                                        <p className="text-sm text-gray-500">{booking.booking_id}</p>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="font-semibold text-text-light">{booking.room?.room_number}</p>
                                        <p className="text-sm text-gray-500">{booking.customer?.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">฿{booking.price_per_night.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">{booking.check_in_date}</p>
                                    </div>
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="text-text-light italic">{t.noBookingsFound}</p>
                    )}
                </div>
            </div>

            {/* Payment Details & Action */}
            {selectedBookingIds.length > 0 && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-text-dark mb-4">{t.paymentDetails}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-dark">{t.paymentMethod}</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'Cash' | 'Transfer')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow">
                                <option value="Cash">{t.cash}</option>
                                <option value="Transfer">{t.transfer}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-dark">{t.paymentDate}</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleCreateReceipt} className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-yellow hover:bg-opacity-90">
                                {t.createReceipt}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showReceipt && (
                <ReceiptTemplate
                    isOpen={showReceipt}
                    onClose={() => setShowReceipt(false)}
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