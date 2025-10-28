# Project Structure - OFI Route Planner

## Directory Overview

```
ofi-route-planner/
├── public/                    # Static assets
│   ├── favicon.svg           # App favicon
│   ├── logo.svg              # OFI logo
│   └── manifest.json         # PWA manifest
│
├── src/                      # Source code
│   ├── components/           # React components
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── vite-env.d.ts        # Vite environment types
│
├── docs/                     # Documentation
│   ├── PR_DEVELOPMENT_PLAN.md
│   └── PROJECT_STRUCTURE.md
│
├── test-autopop.html         # Standalone test for address prepopulation
├── BRAND_STYLE_GUIDE.md      # Design system documentation
├── index.html                # HTML entry point
├── package.json              # npm dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── README.md                 # Project documentation
```

## Component Architecture

### Core Components

#### App.tsx
- **Purpose**: Main application container and state management
- **Responsibilities**:
  - Managing locations array
  - Route calculation and optimization
  - View mode switching
  - Export functionality coordination
- **Key State**:
  - `locations`: Array of location objects
  - `viewMode`: 'list' | 'map' | 'timeline'
  - `routeDate`: Date for the route
  - `startTime`: Starting time for the route

#### LocationForm.tsx
- **Purpose**: Form for adding/editing locations
- **Features**:
  - Address input with smart prepopulation
  - Geocoding integration
  - Duration and buffer time inputs
  - Type selection (open home/appointment)
- **Smart Prepopulation**:
  - Saves suburb from previous entries
  - Suggests saved suburb as user types
  - Live completion when typing street address

#### LocationCard.tsx
- **Purpose**: Display individual location with actions
- **Features**:
  - Drag handle for reordering
  - Edit and delete buttons
  - Duration and buffer display
  - Address and notes display
- **Interactions**:
  - Click to edit
  - Drag to reorder
  - Delete with confirmation

#### RouteMap.tsx
- **Purpose**: Interactive map visualization
- **Dependencies**: Leaflet, React-Leaflet
- **Features**:
  - Markers for each location
  - Route polyline
  - Auto-fit bounds
  - Different colors for location types

#### RouteTimeline.tsx
- **Purpose**: Timeline view of the route
- **Features**:
  - Arrival and departure times
  - Travel time between locations
  - Total route duration
  - Visual timeline representation

#### ExportModal.tsx
- **Purpose**: Calendar export functionality
- **Export Options**:
  - Download ICS file
  - Add to Google Calendar
  - Open in Apple Calendar
- **Event Creation**:
  - Creates events for each location
  - Includes travel time
  - Adds location details in description

### Utility Modules

#### utils/geocoding.ts
- **Purpose**: Address geocoding services
- **Functions**:
  - `geocodeAddress()`: Convert address to coordinates
  - `reverseGeocode()`: Convert coordinates to address
- **Features**:
  - Retry logic with exponential backoff
  - Error handling for rate limits
  - Country code filtering support

#### utils/route.ts
- **Purpose**: Route calculation and optimization
- **Functions**:
  - `calculateDistance()`: Distance between two points
  - `optimizeRoute()`: Nearest neighbor optimization
  - `generateRouteSegments()`: Create route segments
  - `calculateTotalDistance()`: Sum route distance
  - `calculateTotalDuration()`: Sum route duration
- **Features**:
  - Google Maps API integration (optional)
  - Fallback to Haversine formula
  - Time-based calculations

#### utils/storage.ts
- **Purpose**: Local storage management
- **Functions**:
  - `saveLastLocation()`: Save address for prepopulation
  - `loadLastLocation()`: Retrieve saved address
  - `saveLastSuburb()`: Save suburb separately
  - `loadLastSuburb()`: Load saved suburb
  - Route saving/loading (deprecated)
- **Storage Keys**:
  - `ofi-route-planner-last-location-v4`
  - `ofi-route-planner-last-suburb`
  - `ofi-route-planner-settings`

#### utils/calendar.ts
- **Purpose**: Calendar export functionality
- **Functions**:
  - `generateICSContent()`: Create ICS file content
  - `downloadICS()`: Trigger ICS download
  - `addToGoogleCalendar()`: Generate Google Calendar URL
  - `formatEventDate()`: Format dates for calendar

## Type System

### Core Types (types/index.ts)

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
  duration: number;      // minutes
  buffer: number;        // minutes
  type: 'openHome' | 'appointment';
  notes?: string;
  startTime?: string;    // HH:MM
  endTime?: string;      // HH:MM
}

interface RouteSegment {
  from: Location;
  to: Location;
  distance: number;      // km
  duration: number;      // minutes
  departureTime?: Date;
  arrivalTime?: Date;
}

interface Route {
  id: string;
  name: string;
  date: string;
  startTime: string;
  locations: Location[];
  createdAt: string;
  updatedAt: string;
}
```

## State Management

### Current Approach
- React hooks for local state
- Props drilling for shared state
- Local storage for persistence

### State Flow
1. **Location Management**
   - App.tsx holds master locations array
   - Passed down to child components
   - Updates bubble up through callbacks

2. **Route Calculations**
   - Computed on location changes
   - Segments generated in App.tsx
   - Passed to Map and Timeline components

3. **UI State**
   - View mode in App.tsx
   - Form visibility in App.tsx
   - Modal states managed locally

## Styling Architecture

### Design System
- CSS variables for theming
- Consistent spacing scale
- Apple-inspired design language

### Key Variables
```css
--color-primary: #007AFF (Royal Blue)
--color-background: #F5F5F7
--color-surface: #FFFFFF
--color-text: #1D1D1F
--color-border: #D2D2D7
--spacing-xs through --spacing-xl
--radius-sm, --radius-md, --radius-lg
```

### Component Styling
- Inline styles for dynamic values
- CSS classes for static styles
- Framer Motion for animations

## Build & Development

### Scripts
- `npm run dev`: Development server
- `npm run build`: Production build
- `npm run preview`: Preview production build
- `npm run lint`: ESLint checking
- `npm run typecheck`: TypeScript validation

### Environment Configuration
- `.env.local` for local development
- `VITE_GOOGLE_MAPS_API_KEY` for enhanced routing

### Dependencies
- **Core**: React 19, TypeScript
- **Build**: Vite
- **Routing**: React (no router needed)
- **Maps**: Leaflet, React-Leaflet
- **Animation**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Dates**: date-fns

## Data Flow

### Adding a Location
1. User clicks "Add Location"
2. LocationForm renders
3. User enters address
4. Geocoding converts to coordinates
5. Form submission creates Location object
6. App.tsx adds to locations array
7. Route recalculates automatically

### Optimizing Route
1. User clicks "Optimize Route"
2. App.tsx calls optimizeRoute()
3. Nearest neighbor algorithm runs
4. Locations array reordered
5. Components re-render with new order

### Exporting Route
1. User clicks export button
2. ExportModal opens
3. User selects export type
4. Calendar utility generates format
5. File downloads or URL opens

## Future Considerations

### Scalability
- Consider state management library for complex state
- Implement code splitting for large components
- Add service worker for offline support

### Performance
- Virtualize long location lists
- Debounce geocoding requests
- Implement route caching

### Testing
- Unit tests for utilities
- Component testing with React Testing Library
- E2E tests with Playwright/Cypress

### Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader announcements

This structure provides a solid foundation for the current application while allowing for future growth and feature additions.