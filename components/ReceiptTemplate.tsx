import React, { useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../types';

interface Booking {
  room: {
    room_number: string;
    room_type: string;
  } | null;
  check_in_date: string;
  check_out_date: string;
  price_per_night: number;
  payment_status?: string;
}

interface Customer {
  customer_name: string;
  customer_tax_id?: string;
  customer_tel?: string;
  customer_tax_address?: string;
}

interface ReceiptPageProps {
  bookings: Booking[];
  paymentDate: string;
}

const ReceiptPage: React.FC<ReceiptPageProps> = ({ bookings, paymentDate }) => {
  const { language } = useLanguage();

  const translations = {
    th: {
      receiptTitle: 'ใบเสร็จรับเงิน',
      date: 'วันที่',
      customerName: 'ชื่อผู้เข้าพัก',
      taxId: 'เลขประจำตัวผู้เสียภาษี',
      tel: 'โทรศัพท์',
      address: 'ที่อยู่',
      roomNumber: 'หมายเลขห้อง',
      roomType: 'ประเภทห้อง',
      checkIn: 'เช็คอิน',
      checkOut: 'เช็คเอาท์',
      pricePerNight: 'ราคาต่อคืน',
      nights: 'จำนวนคืน',
      total: 'รวม',
      paymentStatus: 'สถานะการชำระเงิน',
      paid: 'ชำระแล้ว',
      unpaid: 'ยังไม่ชำระ',
      hotelInfo: {
        name: 'โรงแรมริเวอร์ ซันไรส์',
        address: '123 ถนนริมน้ำ ตำบลในเมือง อำเภอเมือง จังหวัดมหาสารคาม',
        tel: 'โทร. 043-123456',
      },
    },
    en: {
      receiptTitle: 'Receipt',
      date: 'Date',
      customerName: 'Guest Name',
      taxId: 'Tax ID',
      tel: 'Tel',
      address: 'Address',
      roomNumber: 'Room No.',
      roomType: 'Room Type',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      pricePerNight: 'Price/Night',
      nights: 'Nights',
      total: 'Total',
      paymentStatus: 'Payment Status',
      paid: 'Paid',
      unpaid: 'Unpaid',
      hotelInfo: {
        name: 'River Sunrise Hotel',
        address: '123 Riverside Rd., Mueang, Maha Sarakham, Thailand',
        tel: 'Tel. 043-123456',
      },
    },
  };

  const t = translations[language as 'th' | 'en'];

  const formattedPaymentDate = paymentDate
    ? new Date(paymentDate + 'T00:00:00Z').toLocaleDateString(
        language === 'th' ? 'th-TH' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }
      )
    : '-';

  const customer: Customer = bookings[0]?.customer || ({} as Customer);

  const totalAmount = useMemo(() => {
    return bookings.reduce((sum, booking) => {
      const room = booking.room;
      if (!room || !booking.check_in_date || !booking.check_out_date) return sum;
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const nights = Math.max(
        0,
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + nights * (booking.price_per_night || 0);
    }, 0);
  }, [bookings]);

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8 font-sans">
      {/* หัวกระดาษ */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">{t.receiptTitle}</h1>
        <p className="text-sm text-gray-600">{t.date}: {formattedPaymentDate}</p>
      </div>

      {/* ข้อมูลโรงแรม */}
      <div className="mb-6 text-center">
        <p className="font-semibold">{t.hotelInfo?.name || '-'}</p>
        <p className="text-xs">{t.hotelInfo?.address || '-'}</p>
        <p className="text-xs">{t.hotelInfo?.tel || '-'}</p>
      </div>

      {/* ข้อมูลลูกค้า */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">{t.customerName}: {customer.customer_name || '-'}</h2>
        <p className="text-sm">{t.taxId}: {customer.customer_tax_id || '-'}</p>
        <p className="text-sm">{t.tel}: {customer.customer_tel || '-'}</p>
        <p className="text-sm">{t.address}: {customer.customer_tax_address || '-'}</p>
      </div>

      {/* ตารางจอง */}
      <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">{t.roomNumber}</th>
            <th className="border border-gray-300 p-2">{t.roomType}</th>
            <th className="border border-gray-300 p-2">{t.checkIn}</th>
            <th className="border border-gray-300 p-2">{t.checkOut}</th>
            <th className="border border-gray-300 p-2">{t.pricePerNight}</th>
            <th className="border border-gray-300 p-2">{t.nights}</th>
            <th className="border border-gray-300 p-2">{t.total}</th>
            <th className="border border-gray-300 p-2">{t.paymentStatus}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking, index) => {
            const room = booking.room;
            if (!room || !booking.check_in_date || !booking.check_out_date) return null;

            const checkIn = new Date(booking.check_in_date);
            const checkOut = new Date(booking.check_out_date);
            const nights = Math.max(
              0,
              (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
            );
            const total = nights * (booking.price_per_night || 0);

            return (
              <tr key={index} className="text-center">
                <td className="border border-gray-300 p-2">{room.room_number}</td>
                <td className="border border-gray-300 p-2">{room.room_type}</td>
                <td className="border border-gray-300 p-2">{booking.check_in_date}</td>
                <td className="border border-gray-300 p-2">{booking.check_out_date}</td>
                <td className="border border-gray-300 p-2">{booking.price_per_night}</td>
                <td className="border border-gray-300 p-2">{nights}</td>
                <td className="border border-gray-300 p-2">{total.toFixed(2)}</td>
                <td className="border border-gray-300 p-2">
                  {booking.payment_status === 'paid' ? t.paid : t.unpaid}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* รวมยอด */}
      <div className="text-right font-semibold text-lg">
        {t.total}: {totalAmount.toFixed(2)}
      </div>
    </div>
  );
};

export default ReceiptPage;