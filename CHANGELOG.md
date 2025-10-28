# Changelog

All notable changes to the OFI Route Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-28

### Added
- Initial release of OFI Route Planner
- Core location management (add, edit, delete, reorder)
- Smart address prepopulation based on previous entries
- Drag-and-drop reordering of locations
- Route optimization using nearest neighbor algorithm
- Interactive map visualization with Leaflet
- Timeline view showing arrival times and travel durations
- Calendar export functionality (ICS, Google Calendar, Apple Calendar)
- Responsive design for mobile and desktop devices
- Local storage for user preferences

### Features
- **Address Prepopulation**: Automatically saves and suggests suburbs from previous entries
- **Error Handling**: Graceful handling of geocoding failures with user-friendly messages
- **Route Calculation**: Uses Google Maps API when available, falls back to Haversine formula
- **Export Options**: Multiple calendar export formats with travel time included
- **Visual Design**: Apple-inspired interface with smooth animations

### Technical
- Built with React 19 and TypeScript
- Vite for fast development and building
- OpenStreetMap Nominatim for geocoding
- Leaflet for mapping functionality
- Framer Motion for animations
- @dnd-kit for drag-and-drop support

## [0.9.0] - 2024-10-27 (Pre-release)

### Added
- Address suggestion system with mock data (removed in 1.0.0)
- Debug panel for testing prepopulation (removed in 1.0.0)
- Saved routes modal (removed in 1.0.0)

### Changed
- Multiple iterations of address prepopulation logic
- Various UI improvements and bug fixes

### Fixed
- Delete button conflict with drag-and-drop
- Prepopulation not working correctly
- TypeScript type errors

## Development History

### Recent Commits
- Remove all mock address data and debug UI
- Merge stashed changes with remote updates
- Add real Victorian street names and suburbs (later removed)
- Fix TypeScript errors
- Implement address prepopulation v3
- Fix delete button drag-and-drop conflict
- Add arrival times and travel information