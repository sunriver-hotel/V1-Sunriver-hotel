import React, { useState, useEffect, useMemo } from 'react';
import type { Language, Room, Booking, BookingStatus } from '../types';
import { translations } from '../constants';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Partial<Booking>) => void;
  language: Language;
  rooms: Room[];
  existingBooking: Booking | null;
  bookings: Booking[];
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, language, rooms, existingBooking, bookings }) => {
  const t = translations[language];

  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
    room_id: '',
    price_per_night: 800,
    status: 'Unpaid' as BookingStatus,
    deposit: 0,
  });

  useEffect(() => {
    if (existingBooking) {
      setFormData({
        customer_name: existingBooking.customer?.customer_name || '',
        phone: existingBooking.customer?.phone || '',
        email: existingBooking.customer?.email || '',
        address: existingBooking.customer?.address || '',
        tax_id: existingBooking.customer?.tax_id || '',
        check_in_date: existingBooking.check_in_date,
        check_out_date: existingBooking.check_out_date,
        room_id: String(existingBooking.room_id),
        price_per_night: existingBooking.price_per_night,
        status: existingBooking.status,
        deposit: existingBooking.deposit || 0,
      });
    }
  }, [existingBooking]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_id) {
        alert("Please select a room.");
        return;
    }
    const payload = {
      ...(existingBooking || {}),
      customer: {
        ...(existingBooking?.customer || {}),
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        tax_id: formData.tax_id,
      },
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      room_id: parseInt(formData.room_id, 10),
      price_per_night: parseFloat(String(formData.price_per_night)),
      status: formData.status,
      deposit: parseFloat(String(formData.deposit)),
    };
    onSave(payload);
  };
  
  const availableRooms = useMemo(() => {
    const checkInTime = new Date(formData.check_in_date).getTime();
    const checkOutTime = new Date(formData.check_out_date).getTime();

    if (isNaN(checkInTime) || isNaN(checkOutTime) || checkInTime >= checkOutTime) {
      return rooms;
    }

    const bookedRoomIds = new Set<number>();
    bookings.forEach(booking => {
        // Skip the current booking if we are editing it
        if (existingBooking && booking.booking_id === existingBooking.booking_id) {
            return;
        }

        const bookingCheckInTime = new Date(booking.check_in_date).getTime();
        const bookingCheckOutTime = new Date(booking.check_out_date).getTime();

        // Check for overlap
        if (checkInTime < bookingCheckOutTime && checkOutTime > bookingCheckInTime) {
            bookedRoomIds.add(booking.room_id);
        }
    });

    return rooms.filter(room => !bookedRoomIds.has(room.room_id));
  }, [formData.check_in_date, formData.check_out_date, bookings, rooms, existingBooking]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-dark mb-4">{existingBooking ? t.editBooking : t.newBooking}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
            <h3 className="col-span-full font-semibold text-lg">Customer Information</h3>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.customerName}</label>
              <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.phone}</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.email}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.taxId}</label>
              <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-dark">{t.address}</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
          </div>
          
          {/* Booking Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
            <h3 className="col-span-full font-semibold text-lg">Booking Information</h3>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.checkInDate}</label>
              <input type="date" name="check_in_date" value={formData.check_in_date} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
             <div>
              <label className="block text-sm font-medium text-text-dark">{t.checkOutDate}</label>
              <input type="date" name="check_out_date" value={formData.check_out_date} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-dark">{t.room}</label>
              <select name="room_id" value={formData.room_id} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow">
                <option value="">{t.selectRoom}</option>
                {availableRooms.sort((a,b) => a.room_number.localeCompare(b.room_number)).map(room => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.room_number} - {room.room_type} ({room.bed_type})
                  </option>
                ))}
                {/* If editing, ensure the original room is in the list even if unavailable */}
                {existingBooking && !availableRooms.some(r => r.room_id === existingBooking.room_id) && rooms.find(r => r.room_id === existingBooking.room_id) &&
                    <option key={existingBooking.room_id} value={existingBooking.room_id}>
                        {rooms.find(r=>r.room_id === existingBooking.room_id)?.room_number} - (Currently booked)
                    </option>
                }
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.pricePerNight}</label>
              <input type="number" name="price_per_night" value={formData.price_per_night} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.status}</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow">
                {(Object.keys(t.statuses) as BookingStatus[]).map(statusKey => (
                  <option key={statusKey} value={statusKey}>{t.statuses[statusKey]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.deposit}</label>
              <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-dark rounded-md hover:bg-gray-300">{t.cancel}</button>
            <button type="submit" className="px-4 py-2 bg-primary-yellow text-white rounded-md hover:bg-opacity-90">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
