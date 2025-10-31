import React, { useMemo } from 'react';
import type { Language, Booking } from '../types';
import { translations } from '../constants';

interface ReceiptTemplateProps {
    isOpen: boolean;
    onClose: () => void;
    bookings: Booking[];
    logoSrc: string | null;
    language: Language;
    paymentMethod: 'Cash' | 'Transfer';
    paymentDate: string;
}

interface GroupedItem {
    description: string;
    checkIn: string;
    checkOut: string;
    unitPrice: number;
    roomCount: number;
    nights: number;
    total: number;
}

const calculateNights = (checkIn: string | null | undefined, checkOut: string | null | undefined): number => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn + 'T00:00:00Z').getTime();
    const end = new Date(checkOut + 'T00:00:00Z').getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 1;
    const duration = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(duration));
};

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
    isOpen,
    onClose,
    bookings,
    logoSrc,
    language,
    paymentMethod,
    paymentDate,
}) => {
    const t = translations[language];
    if (!isOpen || bookings.length === 0) return null;

    const customer = bookings[0]?.customer || {};
    const printDate = new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const groupedItems = useMemo(() => {
        const itemsMap = new Map<string, GroupedItem>();

        bookings.forEach((booking) => {
            const room = booking.room;
            if (!room || !booking.check_in_date || !booking.check_out_date) return;

            const roomType = room.room_type || 'N/A';
            const bedType = room.bed_type || 'N/A';
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);
            const price = booking.price_per_night || 0;
            const key = `${roomType}-${bedType}-${price}-${booking.check_in_date}-${booking.check_out_date}`;

            if (itemsMap.has(key)) {
                const existingItem = itemsMap.get(key)!;
                existingItem.roomCount += 1;
                existingItem.total += nights * price;
            } else {
                let description = `${roomType}`;
                if (language === 'th') {
                    if (roomType === 'River view') description = 'ห้องพัก ริเวอร์ ซันไรส์';
                    else if (roomType === 'Standard view' && bedType === 'Twin bed')
                        description = 'ห้องพัก สแตนดาร์ด ทวิน';
                    else if (roomType === 'Standard view' && bedType === 'Double bed')
                        description = 'ห้องพัก สแตนดาร์ด ดับเบิล';
                    else if (roomType === 'Cottage') description = 'ห้องพัก บ้านไม้';
                    else description = `ห้องพัก (${roomType})`;
                } else {
                    if (roomType === 'River view') description = 'River Sunrise Room';
                    else if (roomType === 'Standard view' && bedType === 'Twin bed')
                        description = 'Standard Twin Room';
                    else if (roomType === 'Standard view' && bedType === 'Double bed')
                        description = 'Standard Double Room';
                    else if (roomType === 'Cottage') description = 'Cottage Room';
                    else description = `Room (${roomType})`;
                }

                itemsMap.set(key, {
                    description,
                    checkIn: booking.check_in_date,
                    checkOut: booking.check_out_date,
                    unitPrice: price,
                    roomCount: 1,
                    nights,
                    total: nights * price,
                });
            }
        });

        return Array.from(itemsMap.values());
    }, [bookings, language]);

    const totalAmount = groupedItems.reduce((sum, item) => sum + item.total, 0);
    const formattedPaymentDate = paymentDate
        ? new Date(paymentDate + 'T00:00:00Z').toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC',
          })
        : '-';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 font-['Sarabun',_sans-serif]">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                @media print {
                    body * { visibility: hidden; }
                    .no-print { display: none; }
                    #receipt-printable, #receipt-printable * { visibility: visible; }
                    #receipt-printable {
                        position: absolute; left: 0; top: 0; width: 100%; height: auto;
                        font-size: 10pt;
                    }
                    @page { size: A4; margin: 2cm; }
                }
                `}
            </style>

            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[95vh] flex flex-col">
                {/* Header buttons */}
                <div className="p-4 bg-white rounded-t-lg flex justify-between items-center no-print">
                    <h2 className="text-xl font-bold text-text-dark">{t.receipt}</h2>
                    <div>
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-primary-yellow text-white rounded-md mr-2"
                        >
                            {t.print}
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-dark rounded-md">
                            {t.cancel}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow overflow-y-auto p-2 sm:p-4">
                    <div
                       