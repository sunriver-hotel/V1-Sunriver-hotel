import React from 'react';
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

    const subtotal = bookings.reduce((sum, b) => {
        const nights = calculateNights(b.check_in_date, b.check_out_date);
        return sum + (nights * b.price_per_night);
    }, 0);
    
    const totalDeposit = bookings.reduce((sum, b) => sum + (b.deposit || 0), 0);
    const total = subtotal - totalDeposit;
    
    const hotelInfo = {
        name: language === 'th' ? 'ห้างหุ้นส่วนจำกัด ซันริเวอร์โฮเทล' : 'Sunriver Hotel Limited Partnership',
        addressLine1: language === 'th' ? '215 หมู่ 1 ถนนอภิบาลบัญชา' : '215 Moo 1, Apibanbancha Rd.',
        addressLine2: language === 'th' ? 'ตำบลท่าอุเทน อำเภอท่าอุเทน จังหวัดนครพนม 48120' : 'Tha Uthen, Nakhon Phanom 48120',
        phone: language === 'th' ? 'โทร 093-152-9564' : 'Tel. 093-152-9564',
        taxId: language === 'th' ? 'เลขประจำตัวผู้เสียภาษี 0483568000055' : 'TAX ID 0483568000055'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
             {/* This style block is crucial for print formatting */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #receipt-printable, #receipt-printable * {
                        visibility: visible;
                    }
                    #receipt-printable {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        font-size: 12pt;
                    }
                    .no-print {
                        display: none;
                    }
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
                <div className="flex-grow overflow-y-auto p-4 sm:p-8">
                     <div id="receipt-printable" className="bg-white p-8 A4-size-simulation text-gray-800">
                        {/* Header */}
                        <header className="flex justify-between items-start pb-6 border-b-2 border-gray-800">
                            <div className="flex items-center gap-4">
                                {logoSrc && <img src={logoSrc} alt="Logo" className="h-20 w-20 object-contain"/>}
                                <div>
                                    <h1 className="text-xl font-bold">{hotelInfo.name}</h1>
                                    <p className="text-sm">{hotelInfo.addressLine1}</p>
                                    <p className="text-sm">{hotelInfo.addressLine2}</p>
                                    <p className="text-sm">{hotelInfo.phone}</p>
                                    <p className="text-sm">{hotelInfo.taxId}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-bold uppercase">{t.receipt}</h2>
                                <div className="mt-2">
                                    <p className="text-sm"><span className="font-semibold">{t.receiptNo}:</span></p>
                                    {bookings.map(b => <p key={b.booking_id} className="text-sm">{b.booking_id}</p>)}
                                </div>
                                <p className="text-sm mt-1"><span className="font-semibold">{t.date}:</span> {printDate}</p>
                            </div>
                        </header>

                        {/* Customer Info */}
                        <section className="mt-6">
                            <h3 className="font-semibold">{t.billTo}:</h3>
                            <p>{customer?.customer_name}</p>
                            <p>{customer?.address || 'N/A'}</p>
                            <p>{customer?.phone}</p>
                            <p>{customer?.email}</p>
                            {customer?.tax_id && <p>{t.taxId}: {customer.tax_id}</p>}
                        </section>

                        {/* Items Table */}
                        <section className="mt-8">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-gray-400">
                                    <tr>
                                        <th className="py-2 font-semibold">{t.description}</th>
                                        <th className="py-2 font-semibold text-right">{t.amount}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(booking => {
                                        const nights = calculateNights(booking.check_in_date, booking.check_out_date);
                                        const total = nights * booking.price_per_night;
                                        return (
                                            <tr key={booking.booking_id} className="border-b border-gray-200">
                                                <td className="py-3">
                                                    <p className="font-medium">{booking.room?.room_type} ({booking.room?.bed_type})</p>
                                                    <p className="text-sm text-gray-600">
                                                        {booking.check_in_date} - {booking.check_out_date} ({nights} {t.nights})
                                                    </p>
                                                </td>
                                                <td className="py-3 text-right">฿{total.toFixed(2)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </section>
                        
                        {/* Totals Section */}
                        <section className="mt-6 flex justify-end">
                             <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold">{t.subtotal}:</span>
                                    <span>฿{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold">{t.deposit}:</span>
                                    <span>- ฿{totalDeposit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2">
                                    <span>{t.total}:</span>
                                    <span>฿{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>
                        
                         {/* Payment Info */}
                        <section className="mt-6 text-sm">
                            <p><span className="font-semibold">{t.paymentMethod}:</span> {paymentMethod === 'Cash' ? t.cash : t.transfer}</p>
                             <p><span className="font-semibold">{t.paymentDate}:</span> {new Date(paymentDate + 'T00:00:00Z').toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                        </section>

                        {/* Footer */}
                        <footer className="mt-12 text-center text-sm text-gray-600 border-t pt-4">
                            <p>{t.thankYou}</p>
                        </footer>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;
