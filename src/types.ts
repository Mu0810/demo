export type Suite = {
  id: string;
  name: string;
  rate: number;
  maxGuests: number;
  size: number;
  description: string;
  amenities: string[];
  hero: string;
  gallery: string[];
};

export type DateRange = {
  checkIn: string;  // ISO YYYY-MM-DD
  checkOut: string; // ISO YYYY-MM-DD
};

export type Reservation = {
  code: string;
  suiteId: string;
  range: DateRange;
  guests: number;
  guestName: string;
  guestEmail: string;
  total: number;
  createdAt: string;
};
