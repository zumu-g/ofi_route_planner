export interface Location {
  id: string;
  address: string;
  name?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  duration: number; // in minutes
  buffer: number; // in minutes
  notes?: string;
  type: 'openHome' | 'appointment';
  startTime?: string; // ISO string
  endTime?: string; // ISO string
  fixedTime?: string; // HH:mm format - for OFIs with fixed scheduled times
}

export interface Route {
  id: string;
  name: string;
  date: string;
  locations: Location[];
  totalDuration: number;
  totalDistance: number;
  optimized: boolean;
}

export interface RouteSegment {
  from: Location;
  to: Location;
  duration: number; // travel time in minutes
  distance: number; // in km
  arrivalTime: string;
  departureTime: string;
}

export interface CalendarEvent {
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export interface ExportOptions {
  format: 'ics' | 'google' | 'apple';
  includeBuffers: boolean;
  includeNotes: boolean;
}