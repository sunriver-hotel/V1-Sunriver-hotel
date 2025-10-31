export type Language = 'en' | 'th';

export type RoomType = 'River view' | 'Standard view' | 'Cottage';
export type BedType = 'Double bed' | 'Twin bed';
export type BookingStatus = 'Paid' | 'Deposit' | 'Unpaid';


export interface Room {
  room_id: number;
  room_number: string;
  room_type: RoomType;
  bed_type: BedType;
  floor: number;
}

export interface Customer {
    // FIX: Made customer_id optional to allow creating a new customer along with a new booking.
    // The backend will generate the ID.
    customer_id?: number;
    customer_name: string;
    phone: string;
    email?: string;
    address?: string;
    tax_id?: string;
}

export interface Booking {
  booking_id: string;
  customer_id: number;
  room_id: number;
  check_in_date: string; // YYYY-MM-DD
  check_out_date: string; // YYYY-MM-DD
  status: BookingStatus;
  price_per_night: number;
  deposit?: number;
  created_at: string; // ISO string
  // Joined data
  customer?: Customer;
  room?: Room;
}