export type Language = 'en' | 'th';

export type RoomType = 'Single' | 'Double' | 'Suite';

export interface Room {
  id: number;
  roomNumber: string;
  type: RoomType;
}

export interface Booking {
  id: string;
  roomId: number;
  guestName: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
}