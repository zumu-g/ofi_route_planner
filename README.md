# OFI Route Planner

A modern, Apple-design inspired web application for planning efficient routes between open homes and appointments. Built with React, TypeScript, and Vite.

## Features

- **Location Management**: Add open homes and appointments with customizable durations and buffer times
- **Drag & Drop Reordering**: Easily reorganize your route by dragging locations
- **Route Optimization**: Automatically optimize your route for the shortest travel time
- **Interactive Map**: View all locations on an interactive map with route visualization
- **Timeline View**: See a detailed timeline of your planned route
- **Calendar Export**: Export your route to:
  - ICS files (compatible with most calendar apps)
  - Google Calendar
  - Apple Calendar
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Design

The application follows Apple's design principles with:
- Minimalist, clean interface
- Grey and white color scheme with royal blue accents
- Modern Inter font family
- Smooth animations and transitions
- Intuitive user experience

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zumu-g/ofi_route_planner.git
cd ofi-route-planner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Environment Variables (Optional)

Create a `.env.local` file in the root directory to configure:

```env
# Google Maps API Key (optional - for more accurate distance calculations)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Without a Google Maps API key, the app will use OpenStreetMap for geocoding and basic distance calculations.

## Usage

1. **Add Locations**: Click "Add Location" to add open homes or appointments
2. **Set Details**: For each location, specify:
   - Address (automatically geocoded)
   - Duration of visit
   - Buffer time between locations
   - Optional notes
3. **Organize Route**: Drag and drop locations to reorder, or use "Optimize Route" for automatic optimization
4. **View Options**: Switch between List, Map, and Timeline views
5. **Export**: Export your finalized route to your calendar app of choice

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Leaflet** - Interactive maps
- **Framer Motion** - Animations
- **date-fns** - Date manipulation
- **@dnd-kit** - Drag and drop functionality
- **Lucide React** - Icons

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
