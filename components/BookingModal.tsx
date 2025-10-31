import React, { useState, useEffect, useMemo } from 'react';
import type { Language, Room, Booking, BookingStatus, RoomType } from '../types';
import { translations } from '../constants';

// Helper function to format date correctly, avoiding timezone shifts
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: Omit<Partial<Booking>, 'room_id' | 'booking_id'>, roomIds: number[]) => Promise<void>;
  onDelete?: (bookingId: string) => Promise<void>;
  language: Language;
  rooms: Room[];
  existingBooking: Booking | null;
  bookings: Booking[];
  defaultCheckInDate: string | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSave, onDelete, language, rooms, existingBooking, bookings, defaultCheckInDate }) => {
  const t = translations[language];
  
  const getInitialState = (defaultDate: string | null) => {
    const checkIn = defaultDate || formatDateForInput(new Date());
    
    const checkInUtc = new Date(checkIn + 'T00:00:00Z');
    const checkOutUtc = new Date(checkInUtc.getTime());
    checkOutUtc.setUTCDate(checkOutUtc.getUTCDate() + 1);
    const checkOut = checkOutUtc.toISOString().split('T')[0];

    return {
      customer_name: '',
      phone: '',
      email: '',
      address: '',
      tax_id: '',
      check_in_date: checkIn,
      check_out_date: checkOut,
      selectedRoomIds: [] as number[],
      price_per_night: 800,
      status: 'Unpaid' as BookingStatus,
      deposit: 0,
    };
  };

  const [formData, setFormData] = useState(getInitialState(defaultCheckInDate));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (existingBooking) {
          setFormData({
            customer_name: existingBooking.customer?.customer_name || '',
            phone: existingBooking.customer?.phone || '',
            email: existingBooking.customer?.email || '',
            address: existingBooking.customer?.address || '',
            tax_id: existingBooking.customer?.tax_id || '',
            check_in_date: existingBooking.check_in_date,
            check_out_date: existingBooking.check_out_date,
            selectedRoomIds: [existingBooking.room_id],
            price_per_night: existingBooking.price_per_night,
            status: existingBooking.status,
            deposit: existingBooking.deposit || 0,
          });
        } else {
            setFormData(getInitialState(defaultCheckInDate));
        }
    }
  }, [isOpen, existingBooking, defaultCheckInDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoomSelect = (roomId: number) => {
    setFormData(prev => {
        const newSelected = prev.selectedRoomIds.includes(roomId)
            ? prev.selectedRoomIds.filter(id => id !== roomId)
            : [...prev.selectedRoomIds, roomId];
        return { ...prev, selectedRoomIds: newSelected };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedRoomIds.length === 0) {
        alert("Please select at least one room.");
        return;
    }
    setIsSaving(true);
    
    const payload = {
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
      price_per_night: parseFloat(String(formData.price_per_night)),
      status: formData.status,
      deposit: parseFloat(String(formData.deposit)),
    };
    
    try {
        await onSave(payload, formData.selectedRoomIds);
    } catch(error) {
        console.error("Saving failed:", error)
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingBooking || !onDelete) return;

    if (window.confirm(t.deleteConfirm)) {
        setIsDeleting(true);
        try {
            await onDelete(existingBooking.booking_id);
        } catch (error) {
            console.error("Deletion failed:", error);
        } finally {
            setIsDeleting(false);
        }
    }
  };
  
  const availableRooms = useMemo(() => {
    const checkInTime = new Date(formData.check_in_date + 'T00:00:00Z').getTime();
    const checkOutTime = new Date(formData.check_out_date + 'T00:00:00Z').getTime();

    if (isNaN(checkInTime) || isNaN(checkOutTime) || checkInTime >= checkOutTime) {
      return []; // Return empty if dates are invalid to prevent selection
    }

    const bookedRoomIds = new Set<number>();
    bookings.forEach(booking => {
        if (existingBooking && booking.booking_id === existingBooking.booking_id) {
            return;
        }

        const bookingCheckInTime = new Date(booking.check_in_date + 'T00:00:00Z').getTime();
        const bookingCheckOutTime = new Date(booking.check_out_date + 'T00:00:00Z').getTime();

        if (checkInTime < bookingCheckOutTime && checkOutTime > bookingCheckInTime) {
            bookedRoomIds.add(booking.room_id);
        }
    });

    return rooms.filter(room => !bookedRoomIds.has(room.room_id));
  }, [formData.check_in_date, formData.check_out_date, bookings, rooms, existingBooking]);
  
  const getRoomColor = (roomType: RoomType): string => {
    switch (roomType) {
        case 'River view': return 'bg-pastel-blue hover:bg-opacity-80';
        case 'Standard view': return 'bg-pastel-green hover:bg-opacity-80';
        case 'Cottage': return 'bg-pastel-purple hover:bg-opacity-80';
        default: return 'bg-gray-200 hover:bg-gray-300';
    }
  }

  if (!isOpen) return null;

  const renderRoomSelector = () => {
    if (existingBooking) {
        // For editing, show a simple dropdown
        return (
             <select 
                name="selectedRoomIds" 
                value={formData.selectedRoomIds[0] || ''} 
                onChange={(e) => setFormData(prev => ({...prev, selectedRoomIds: [parseInt(e.target.value, 10)]}))}
                required 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow"
             >
                <option value="">{t.selectRoom}</option>
                {rooms.sort((a,b) => a.room_number.localeCompare(b.room_number)).map(room => (
                    <option key={room.room_id} value={room.room_id} disabled={!availableRooms.some(ar => ar.room_id === room.room_id) && room.room_id !== existingBooking.room_id}>
                        {room.room_number} - {room.room_type} ({room.bed_type})
                    </option>
                ))}
             </select>
        );
    }
    
    // For new bookings, show the multi-select grid
    return (
        <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {rooms.sort((a,b) => a.room_number.localeCompare(b.room_number)).map(room => {
                const isAvailable = availableRooms.some(ar => ar.room_id === room.room_id);
                const isSelected = formData.selectedRoomIds.includes(room.room_id);

                return (
                    <button
                        type="button"
                        key={room.room_id}
                        onClick={() => isAvailable && handleRoomSelect(room.room_id)}
                        disabled={!isAvailable}
                        className={`p-2 rounded-md text-center font-semibold text-sm transition-all duration-200
                            ${isAvailable 
                                ? (isSelected ? 'bg-primary-yellow text-white ring-2 ring-yellow-600' : `${getRoomColor(room.room_type)} text-text-dark`)
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed line-through'
                            }
                        `}
                    >
                        {room.room_number}
                    </button>
                )
            })}
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-text-dark mb-6">{existingBooking ? t.editBooking : t.newBooking}</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
            {/* Customer Info */}
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.customerName}<span className="text-red-500 ml-1">*</span></label>
              <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark">{t.phone}<span className="text-red-500 ml-1">*</span></label>
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
             <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-text-dark">{t.address}</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={1} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow resize-y" />
            </div>
            
            {/* Divider */}
            <div className="col-span-full border-t border-gray-200 my-2"></div>

            {/* Booking Info */}
            <div className="col-span-full lg:col-span-2 grid grid-cols-2 gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark">{t.checkInDate}</label>
                  <input type="date" name="check_in_date" value={formData.check_in_date} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-text-dark">{t.checkOutDate}</label>
                  <input type="date" name="check_out_date" value={formData.check_out_date} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-yellow focus:border-primary-yellow" />
                </div>
            </div>
            <div className="hidden lg:block"></div> {/* Spacer for grid */}
             
            <div className="col-span-full">
                <label className="block text-sm font-medium text-text-dark">{t.room}</label>
                {renderRoomSelector()}
            </div>
            
            {/* Divider */}
            <div className="col-span-full border-t border-gray-200 my-2"></div>

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


          <div className="flex justify-between items-center pt-6">
             <div>
                {existingBooking && onDelete && (
                    <button 
                        type="button" 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
                    >
                        {isDeleting ? t.deleting : t.deleteBooking}
                    </button>
                )}
             </div>
             <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-dark rounded-md hover:bg-gray-300">{t.cancel}</button>
                <button type="submit" disabled={isSaving || isDeleting} className="px-4 py-2 bg-primary-yellow text-white rounded-md hover:bg-opacity-90 disabled:bg-yellow-300">{isSaving ? t.saving : t.save}</button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;