# API Reference - OFI Route Planner

## Table of Contents

- [Components](#components)
- [Utilities](#utilities)
- [Types](#types)
- [Environment Variables](#environment-variables)

## Components

### LocationForm

Form component for adding/editing locations.

```typescript
interface LocationFormProps {
  onAdd: (location: Location) => void;
  onCancel: () => void;
  editLocation?: Location;
}
```

**Features:**
- Smart address prepopulation
- Geocoding with error handling
- Type selection (openHome/appointment)
- Duration and buffer time inputs

### LocationCard

Display component for individual locations.

```typescript
interface LocationCardProps {
  location: Location;
  index: number;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}
```

**Features:**
- Drag handle for reordering
- Edit and delete actions
- Visual feedback during drag

### RouteMap

Interactive map component using Leaflet.

```typescript
interface RouteMapProps {
  locations: Location[];
  segments: RouteSegment[];
}
```

**Features:**
- Location markers
- Route polyline
- Auto-fit to bounds
- Different colors for location types

### RouteTimeline

Timeline visualization of the route.

```typescript
interface RouteTimelineProps {
  locations: Location[];
  date: string;
  startTime: string;
  segments: RouteSegment[];
}
```

**Features:**
- Arrival/departure times
- Travel duration display
- Total route statistics

### ExportModal

Calendar export functionality.

```typescript
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  date: string;
  startTime: string;
  segments: RouteSegment[];
}
```

**Export Options:**
- ICS file download
- Google Calendar
- Apple Calendar

## Utilities

### Geocoding (`utils/geocoding.ts`)

#### geocodeAddress

Converts an address string to coordinates.

```typescript
async function geocodeAddress(address: string): Promise<GeocodeResult | null>

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}
```

**Features:**
- Retry logic with exponential backoff
- Rate limit handling
- Country code filtering

#### reverseGeocode

Converts coordinates to an address.

```typescript
async function reverseGeocode(
  lat: number, 
  lng: number
): Promise<string | null>
```

### Route Calculations (`utils/route.ts`)

#### calculateDistance

Calculates distance and duration between two locations.

```typescript
async function calculateDistance(
  from: Location, 
  to: Location
): Promise<{ distance: number; duration: number }>
```

**Features:**
- Google Maps API integration (if key provided)
- Fallback to Haversine formula
- Returns distance in km, duration in minutes

#### optimizeRoute

Optimizes location order for shortest travel time.

```typescript
async function optimizeRoute(
  locations: Location[], 
  startTime: string
): Promise<Location[]>
```

**Algorithm:** Nearest neighbor

#### generateRouteSegments

Creates route segments with timing information.

```typescript
async function generateRouteSegments(
  locations: Location[], 
  date: string, 
  startTime: string
): Promise<RouteSegment[]>
```

### Storage (`utils/storage.ts`)

#### Address Prepopulation

```typescript
function saveLastLocation(address: string): void
function loadLastLocation(): { address: string; suburb: string } | null
function saveLastSuburb(suburb: string): void
function loadLastSuburb(): string
```

**Storage Keys:**
- `ofi-route-planner-last-location-v4`
- `ofi-route-planner-last-suburb`

### Calendar Export (`utils/calendar.ts`)

#### generateICSContent

Creates ICS file content for calendar import.

```typescript
function generateICSContent(
  locations: Location[], 
  date: string, 
  startTime: string, 
  segments: RouteSegment[]
): string
```

#### Calendar URLs

```typescript
function downloadICS(content: string, filename: string): void
function addToGoogleCalendar(event: CalendarEvent): void
```

## Types

### Core Types

```typescript
interface Coordinates {
  lat: number;
  lng: number;
}

interface Location {
  id: string;
  name?: string;
  address: string;
  coordinates?: Coordinates;
  duration: number;      // Visit duration in minutes
  buffer: number;        // Buffer time in minutes
  type: 'openHome' | 'appointment';
  notes?: string;
  startTime?: string;    // HH:MM format
  endTime?: string;      // HH:MM format
}

interface RouteSegment {
  from: Location;
  to: Location;
  distance: number;      // Distance in kilometers
  duration: number;      // Travel time in minutes
  departureTime?: Date;
  arrivalTime?: Date;
}

interface Route {
  id: string;
  name: string;
  date: string;         // YYYY-MM-DD format
  startTime: string;    // HH:MM format
  locations: Location[];
  createdAt: string;
  updatedAt: string;
}
```

## Environment Variables

### `.env.local`

```bash
# Google Maps API Key (optional)
# Enables more accurate distance calculations and traffic data
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Default country code for geocoding (optional)
# Used to improve geocoding accuracy
VITE_DEFAULT_COUNTRY_CODE=au
```

### Accessing in Code

```typescript
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const countryCode = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || 'au';
```

## Error Handling

### Geocoding Errors

```typescript
// Geocoding returns null on error
const result = await geocodeAddress(address);
if (!result) {
  // Handle error - address not found
}
```

### API Rate Limiting

The geocoding utility includes automatic retry with exponential backoff:
- 3 retry attempts
- Starting delay: 1 second
- Exponential increase: 2x each retry

### User Feedback

Components show user-friendly error messages:
- Geocoding failures
- Network errors
- Invalid input

## Performance Considerations

### Optimization Tips

1. **Geocoding Cache**: Results are not currently cached
2. **Route Calculation**: O(n²) complexity for optimization
3. **Map Rendering**: Large numbers of markers may impact performance
4. **Bundle Size**: Consider lazy loading for production

### Best Practices

1. Debounce address input for geocoding
2. Limit number of locations for optimal performance
3. Use loading states for async operations
4. Handle errors gracefully with fallbacks