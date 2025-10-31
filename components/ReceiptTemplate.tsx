import React, { useMemo } from 'react';
import type { Language, Booking, RoomType, BedType } from '../types';
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

// Data structure for grouped receipt items
interface GroupedItem {
    description: string;
    roomType: RoomType;
    bedType: BedType;
    unitPrice: number;
    roomCount: number;
    totalNights: number;
    total: number;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ isOpen, onClose, bookings, logoSrc, language, paymentMethod, paymentDate }) => {
    const t = translations[language];

    if (!isOpen || bookings.length === 0) return null;

    const customer = bookings[0].customer;
    const printDate = new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const calculateNights = (checkIn: string, checkOut: string): number => {
        const start = new Date(checkIn).getTime();
        const end = new Date(checkOut).getTime();
        return Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    };
    
    // Logic to group bookings by room type and price
    const groupedItems = useMemo(() => {
        const itemsMap = new Map<string, GroupedItem>();

        bookings.forEach(booking => {
            const room = booking.room;
            if (!room) return;

            const key = `${room.room_type}-${room.bed_type}-${booking.price_per_night}`;
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);

            if (itemsMap.has(key)) {
                const existingItem = itemsMap.get(key)!;
                existingItem.roomCount += 1;
                // Total nights should be sum of nights for each booking in the group
                existingItem.totalNights += nights;
                existingItem.total += nights * booking.price_per_night;
            } else {
                 let description = `${room.room_type}`;
                if(language === 'th') {
                   if(room.room_type === 'River view') description = 'ห้องพัก ริเวอร์ ซันไรส์';
                   else if(room.room_type === 'Standard view' && room.bed_type === 'Twin bed') description = 'ห้องพัก สแตนดาร์ด ทวิน';
                   else if(room.room_type === 'Standard view' && room.bed_type === 'Double bed') description = 'ห้องพัก สแตนดาร์ด ดับเบิล';
                   else if(room.room_type === 'Cottage') description = 'ห้องพัก บ้านไม้';
                } else {
                   if(room.room_type === 'River view') description = 'River Sunrise Room';
                   else if(room.room_type === 'Standard view' && room.bed_type === 'Twin bed') description = 'Standard Twin Room';
                   else if(room.room_type === 'Standard view' && room.bed_type === 'Double bed') description = 'Standard Double Room';
                   else if(room.room_type === 'Cottage') description = 'Cottage Room';
                }
                
                itemsMap.set(key, {
                    description: description,
                    roomType: room.room_type,
                    bedType: room.bed_type,
                    unitPrice: booking.price_per_night,
                    roomCount: 1,
                    totalNights: nights,
                    total: nights * booking.price_per_night,
                });
            }
        });
        return Array.from(itemsMap.values());
    }, [bookings, language]);
    
    const totalAmount = groupedItems.reduce((sum, item) => sum + item.total, 0);
    const formattedPaymentDate = new Date(paymentDate + 'T00:00:00Z').toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 font-['Sarabun',_sans-serif]">
             <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                @media print {
                    body * { visibility: hidden; }
                    .no-print { display: none; }
                    #receipt-printable, #receipt-printable * { visibility: visible; }
                    #receipt-printable {
                        position: absolute; left: 0; top: 0; width: 100%; height: auto;
                        font-size: 10pt;
                    }
                    @page { size: A4; margin: 0; }
                }
                `}
            </style>
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[95vh] flex flex-col">
                <div className="p-4 bg-white rounded-t-lg flex justify-between items-center no-print">
                     <h2 className="text-xl font-bold text-text-dark">{t.receipt}</h2>
                     <div>
                        <button onClick={() => window.print()} className="px-4 py-2 bg-primary-yellow text-white rounded-md mr-2">{t.print}</button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-dark rounded-md">{t.cancel}</button>
                     </div>
                </div>
                <div className="flex-grow overflow-y-auto p-2 sm:p-4">
                     <div id="receipt-printable" className="bg-white p-[1.5cm] mx-auto flex flex-col" style={{ width: '21cm', minHeight: '29.7cm' }}>
                        {/* Header */}
                        <header className="flex justify-between items-start pb-4">
                            <div>
                                <h1 className="text-xl font-bold">{language === 'th' ? 'โรงแรมซันริเวอร์' : t.hotelInfo.name_secondary}</h1>
                                <p className="text-sm font-semibold">{t.hotelInfo.name}</p>
                                <p className="text-xs">{t.hotelInfo.address}</p>
                                <p className="text-xs">{language === 'th' ? `โทรศัพท์: ${t.hotelInfo.phone.split(': ')[1]}` : t.hotelInfo.phone}</p>
                                <p className="text-xs">{language === 'th' ? `อีเมล: ${t.hotelInfo.email.split(': ')[1]}` : t.hotelInfo.email}</p>
                                <p className="text-xs">{language === 'th' ? `เลขที่ผู้เสียภาษี: ${t.hotelInfo.taxId.split(': ')[1]}` : t.hotelInfo.taxId}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                {logoSrc && <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain ml-auto mb-2"/>}
                                <h2 className="text-lg font-bold uppercase">{t.receipt}</h2>
                                <p className="text-xs uppercase">RECEIPT</p>
                            </div>
                        </header>
                        
                        <div className="flex justify-between items-end pt-4 border-t-2 border-primary-yellow">
                             {/* Customer Info */}
                             <div className="text-xs w-2/3">
                                <p><span className="font-bold">{t.customerInfo}:</span> {customer?.customer_name}</p>
                                <p><span className="font-bold">{t.addressInfo}:</span> {customer?.address || ''}</p>
                                <p><span className="font-bold">{t.telInfo}:</span> {customer?.phone}</p>
                                {customer?.tax_id && <p><span className="font-bold">{t.taxIdInfo}:</span> {customer.tax_id}</p>}
                            </div>
                            {/* Receipt Details */}
                            <div className="text-xs text-right w-1/3">
                                <p className="font-bold">{t.receiptNo}:</p>
                                {bookings.map(b => <p key={b.booking_id}>{b.booking_id}</p>)}
                                <p className="mt-1"><span className="font-bold">{t.date}:</span> {printDate}</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <section className="mt-6">
                            <table className="w-full text-xs table-auto">
                                <thead className="border-y-2 border-black">
                                    <tr>
                                        <th className="py-1 text-left font-bold w-1/2">{t.description.toUpperCase()}</th>
                                        <th className="py-1 text-center font-bold">{t.noOfRooms.toUpperCase()}</th>
                                        <th className="py-1 text-center font-bold">{t.noOfNights.toUpperCase()}</th>
                                        <th className="py-1 text-right font-bold">{t.unitPrice.toUpperCase()}</th>
                                        <th className="py-1 text-right font-bold">{t.total.toUpperCase()}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedItems.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-2 align-top">{item.description}</td>
                                            <td className="py-2 text-center align-top">{item.roomCount}</td>
                                            <td className="py-2 text-center align-top">{item.totalNights / item.roomCount}</td>
                                            <td className="py-2 text-right align-top">{item.unitPrice.toFixed(2)}</td>
                                            <td className="py-2 text-right align-top">{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                        
                        {/* This div will grow to push the footer down */}
                        <div className="flex-grow"></div>

                        {/* Remarks & Totals */}
                        <section className="mt-auto pt-4">
                            <div className="flex justify-between items-start border-t-2 border-black pt-2">
                                <div className="text-xs w-1/2">
                                    <p className="font-bold">{t.remarks}:</p>
                                </div>
                                <div className="w-1/2 max-w-xs text-xs">
                                    <div className="flex justify-between border-b pb-1">
                                        <span className="font-bold">{t.totalAmount}:</span>
                                        <span className="font-bold">{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Payment Info */}
                        <section className="mt-4 text-xs">
                            <p className="font-bold">{t.paymentInfo}:</p>
                            <p>{paymentMethod === 'Cash' ? `${t.cashPayment}: ${totalAmount.toFixed(2)} ${t.thb}, ${t.date}: ${formattedPaymentDate}` : `${t.transferPayment}: ${totalAmount.toFixed(2)} ${t.thb}, ${t.date}: ${formattedPaymentDate}`}</p>
                        </section>

                        {/* Signature */}
                        <section className="mt-16 flex justify-end">
                            <div className="text-center text-xs w-48">
                                <div className="border-b border-gray-400 mb-1 h-8"></div>
                                <p>({t.authorizedSignature})</p>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="mt-8 text-center text-xs text-gray-500 border-t pt-2">
                            <span>{t.hotelInfo.phone.split(': ')[1]}</span>
                            <span className="mx-2">|</span>
                            <span>{language === 'th' ? "215 หมู่ที่ 1 ต.ท่าอุเทน อ.ท่าอุเทน จ.นครพนม 48120" : "215 Moo 1, Tha Uthen, Nakhon Phanom 48120"}</span>
                        </footer>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;