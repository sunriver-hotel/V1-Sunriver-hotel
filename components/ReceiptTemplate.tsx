import React, { useMemo } from 'react';
// FIX: Added Customer to the type import to allow for correct typing.
import type { Language, Booking, Customer } from '../types';
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
    if (!checkIn || !checkOut) return 1; // Default to 1 night if dates are missing
    const start = new Date(checkIn + 'T00:00:00Z').getTime();
    const end = new Date(checkOut + 'T00:00:00Z').getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 1;
    const duration = (end - start) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(duration));
};

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ isOpen, onClose, bookings, logoSrc, language, paymentMethod, paymentDate }) => {
    const t = translations[language];

    if (!isOpen || bookings.length === 0) return null;

    // FIX 1 (USER SUGGESTION): Safely access customer, ensuring it's always an object to prevent runtime errors.
    // FIX: Explicitly typed `customer` as Partial<Customer> to resolve TypeScript errors when accessing its properties.
    const customer: Partial<Customer> = bookings[0]?.customer || {};

    const printDate = new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const groupedItems = useMemo(() => {
        const itemsMap = new Map<string, GroupedItem>();

        bookings.forEach(booking => {
            const room = booking.room;
            // Skip if essential data for grouping is missing
            if (!room || !booking.check_in_date || !booking.check_out_date) {
                return;
            }

            const roomType = room.room_type || 'N/A';
            const bedType = room.bed_type || 'N/A';
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);
            const price = Number(booking.price_per_night) || 0;
            const key = `${roomType}-${bedType}-${price}-${booking.check_in_date}-${booking.check_out_date}`;

            if (itemsMap.has(key)) {
                const existingItem = itemsMap.get(key)!;
                existingItem.roomCount += 1;
                existingItem.total += nights * price;
            } else {
                 let description = `${roomType}`;
                 if(language === 'th') {
                   if(roomType === 'River view') description = 'ห้องพัก ริเวอร์ ซันไรส์';
                   else if(roomType === 'Standard view' && bedType === 'Twin bed') description = 'ห้องพัก สแตนดาร์ด ทวิน';
                   else if(roomType === 'Standard view' && bedType === 'Double bed') description = 'ห้องพัก สแตนดาร์ด ดับเบิล';
                   else if(roomType === 'Cottage') description = 'ห้องพัก บ้านไม้';
                   else description = `ห้องพัก (${roomType})`
                } else {
                   if(roomType === 'River view') description = 'River Sunrise Room';
                   else if(roomType === 'Standard view' && bedType === 'Twin bed') description = 'Standard Twin Room';
                   else if(roomType === 'Standard view' && bedType === 'Double bed') description = 'Standard Double Room';
                   else if(roomType === 'Cottage') description = 'Cottage Room';
                   else description = `Room (${roomType})`
                }
                
                itemsMap.set(key, {
                    description,
                    checkIn: booking.check_in_date,
                    checkOut: booking.check_out_date,
                    unitPrice: price,
                    roomCount: 1,
                    nights: nights,
                    total: nights * price,
                });
            }
        });
        return Array.from(itemsMap.values());
    }, [bookings, language]);
    
    const totalAmount = groupedItems.reduce((sum, item) => sum + item.total, 0);
    
    // FIX 3 (USER SUGGESTION): Safely format payment date, handling cases where it might be empty or invalid.
    const formattedPaymentDate = paymentDate
        ? new Date(paymentDate + 'T00:00:00Z').toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
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
                <div className="p-4 bg-white rounded-t-lg flex justify-between items-center no-print">
                     <h2 className="text-xl font-bold text-text-dark">{t.receipt}</h2>
                     <div>
                        <button onClick={() => window.print()} className="px-4 py-2 bg-primary-yellow text-white rounded-md mr-2">{t.print}</button>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-dark rounded-md">{t.cancel}</button>
                     </div>
                </div>
                <div className="flex-grow overflow-y-auto p-2 sm:p-4">
                     <div id="receipt-printable" className="bg-white p-8 mx-auto flex flex-col" style={{ width: '21cm', minHeight: '29.7cm' }}>
                        {/* Header */}
                        <header className="flex justify-between items-start pb-4">
                            <div>
                                {/* FIX 2 (USER SUGGESTION): Safely access all hotel info properties. */}
                                {language === 'th' ? (
                                    <>
                                        <h1 className="text-2xl font-bold">{t.loginTitle}</h1>
                                        <h2 className="text-xl font-bold">{t.hotelInfo?.name_secondary || 'Sunriver Hotel'}</h2>
                                    </>
                                ) : (
                                    <h1 className="text-2xl font-bold">{t.hotelInfo?.name_secondary || 'Sunriver Hotel'}</h1>
                                )}
                                <p className="text-sm font-semibold mt-2">{t.hotelInfo?.name || '-'}</p>
                                <p className="text-xs">{t.hotelInfo?.address || '-'}</p>
                                <p className="text-xs">{language === 'th' ? `โทรศัพท์: ${t.hotelInfo?.phone?.split(' ')[1] || '-'}` : t.hotelInfo?.phone || '-'}</p>
                                <p className="text-xs">{language === 'th' ? `อีเมล: ${t.hotelInfo?.email?.split(' ')[1] || '-'}` : t.hotelInfo?.email || '-'}</p>
                                <p className="text-xs">{language === 'th' ? `เลขที่ผู้เสียภาษี: ${t.hotelInfo?.taxId?.split(' ')[1] || '-'}` : t.hotelInfo?.taxId || '-'}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                {logoSrc && <img src={logoSrc} alt="Logo" className="h-20 w-auto object-contain ml-auto mb-2"/>}
                                <h2 className="text-2xl font-bold uppercase">{t.receipt}</h2>
                                <p className="text-sm uppercase">RECEIPT</p>
                            </div>
                        </header>
                        
                        <div className="flex justify-between items-end pt-4 pb-4 border-b border-yellow-500">
                             {/* Customer Info (now safe due to `customer` variable fix) */}
                             <div className="text-xs w-2/3 space-y-1">
                                <p><span className="font-bold w-28 inline-block">{language === 'th' ? 'ชื่อลูกค้า' : 'Customer Name'}:</span> {customer.customer_name || '-'}</p>
                                <p><span className="font-bold w-28 inline-block">{language === 'th' ? 'ที่อยู่' : 'Address'}:</span> {customer.address || '-'}</p>
                                <p><span className="font-bold w-28 inline-block">{language === 'th' ? 'โทรศัพท์' : 'Tel. No.'}:</span> {customer.phone || '-'}</p>
                                <p><span className="font-bold w-28 inline-block">{language === 'th' ? 'เลขที่ผู้เสียภาษี' : 'Tax ID'}:</span> {customer.tax_id || '-'}</p>
                            </div>
                            {/* Receipt Details */}
                            <div className="text-xs text-left w-1/3 pl-4">
                                <div className="flex">
                                    <span className="font-bold w-24 inline-block">{language === 'th' ? 'เลขที่ใบเสร็จ' : 'Receipt No.'}:</span>
                                    <div>{bookings.map((b, i) => <p key={b.booking_id || i}>{b.booking_id || '-'}</p>)}</div>
                                </div>
                                <div className="flex mt-1">
                                    <span className="font-bold w-24 inline-block">{language === 'th' ? 'วันที่' : 'Date'}:</span> 
                                    <p>{printDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <section className="mt-2">
                            <table className="w-full text-xs table-auto">
                                <thead className="border-y-2 border-black">
                                    <tr>
                                        <th className="py-2 px-1 text-left font-bold w-[45%]">{language === 'th' ? 'รายการ' : 'DESCRIPTION'}</th>
                                        <th className="py-2 px-1 text-center font-bold">{language === 'th' ? 'จำนวนห้องพัก' : 'NO. OF ROOMS'}</th>
                                        <th className="py-2 px-1 text-center font-bold">{language === 'th' ? 'จำนวนวันที่เข้าพัก' : 'NO. OF NIGHTS'}</th>
                                        <th className="py-2 px-1 text-right font-bold">{language === 'th' ? 'ราคาต่อห้อง' : 'UNIT PRICE (THB)'}</th>
                                        <th className="py-2 px-1 text-right font-bold">{language === 'th' ? 'รวม' : 'TOTAL'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedItems.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-2 px-1 align-top">
                                                {item.description}
                                                <div className="text-gray-500 text-[9pt]">
                                                   ({item.checkIn} - {item.checkOut})
                                                </div>
                                            </td>
                                            <td className="py-2 px-1 text-center align-top">{item.roomCount}</td>
                                            <td className="py-2 px-1 text-center align-top">{item.nights}</td>
                                            <td className="py-2 px-1 text-right align-top">{item.unitPrice.toFixed(2)}</td>
                                            <td className="py-2 px-1 text-right align-top">{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Add empty rows to fill space */}
                                    {Array.from({ length: Math.max(0, 8 - groupedItems.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="border-b h-10"><td colSpan={5}></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                        
                        {/* This div will grow to push the footer down */}
                        <div className="flex-grow"></div>

                        {/* Remarks & Totals */}
                        <section className="mt-auto pt-2">
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
                            <p>{paymentMethod === 'Cash' ? t.cashPayment : t.transferPayment}: {totalAmount.toFixed(2)} {t.thb}, {t.date} {formattedPaymentDate}</p>
                        </section>

                        {/* Signature */}
                        <section className="mt-24 flex justify-end">
                            <div className="text-center text-xs w-56">
                                <div className="border-b border-gray-500 mb-1 h-8"></div>
                                <p>({t.authorizedSignature})</p>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="mt-8 text-center text-[8pt] text-gray-500 border-t pt-2">
                             <p>{t.hotelInfo?.address || '-'}</p>
                        </footer>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptTemplate;