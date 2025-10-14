import { useState, useEffect } from 'react';
import { 
  Plus, 
  Map, 
  List, 
  Download,
  Navigation,
  Calendar,
  Settings
} from 'lucide-react';
import type { Location, RouteSegment } from './types';
import { LocationForm } from './components/LocationForm';
import { LocationCard } from './components/LocationCard';
import { RouteMap } from './components/RouteMap';
import { RouteTimeline } from './components/RouteTimeline';
import { ExportModal } from './components/ExportModal';
import { 
  generateRouteSegments, 
  optimizeRoute, 
  calculateTotalDistance, 
  calculateTotalDuration 
} from './utils/route';
import { storage } from './utils/storage';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableLocationCard({ location, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LocationCard
        location={location}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
}

function App() {
  const [locations, setLocations] = useState<Location[]>(() => {
    // Load saved locations on initial render
    return storage.loadLocations();
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [routeDate, setRouteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [view, setView] = useState<'list' | 'map' | 'timeline'>('list');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useGoogleMapsDistances, setUseGoogleMapsDistances] = useState(() => {
    const settings = storage.loadSettings();
    return settings.useGoogleMapsDistances;
  });
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(() => {
    const settings = storage.loadSettings();
    return settings.googleMapsApiKey || '';
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save locations whenever they change
  useEffect(() => {
    storage.saveLocations(locations);
  }, [locations]);

  // Save settings whenever they change
  useEffect(() => {
    storage.saveSettings({ useGoogleMapsDistances, googleMapsApiKey });
  }, [useGoogleMapsDistances, googleMapsApiKey]);

  useEffect(() => {
    if (locations.length > 1) {
      generateRouteSegments(locations, startTime).then(setSegments);
    } else {
      setSegments([]);
    }
  }, [locations, startTime]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocations((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddLocation = (location: Location) => {
    if (editingLocation) {
      setLocations(locations.map(loc => loc.id === location.id ? location : loc));
      setEditingLocation(null);
    } else {
      setLocations([...locations, location]);
    }
    setShowAddForm(false);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowAddForm(true);
  };

  const handleOptimizeRoute = async () => {
    if (locations.length < 2) return;
    
    setIsOptimizing(true);
    const optimizedLocations = await optimizeRoute(locations);
    setLocations(optimizedLocations);
    setIsOptimizing(false);
  };

  const totalDistance = calculateTotalDistance(segments);
  const totalDuration = calculateTotalDuration(segments, locations);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--spacing-lg)',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{ margin: 0 }}>OFI Route Planner</h1>
            <p className="text-secondary" style={{ margin: '4px 0 0' }}>
              Plan your open home visits efficiently
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              className="btn-ghost"
              onClick={() => setView('list')}
              style={{ 
                backgroundColor: view === 'list' ? 'var(--color-background)' : 'transparent' 
              }}
            >
              <List size={20} />
              List
            </button>
            <button
              className="btn-ghost"
              onClick={() => setView('map')}
              style={{ 
                backgroundColor: view === 'map' ? 'var(--color-background)' : 'transparent' 
              }}
            >
              <Map size={20} />
              Map
            </button>
            <button
              className="btn-ghost"
              onClick={() => setView('timeline')}
              style={{ 
                backgroundColor: view === 'timeline' ? 'var(--color-background)' : 'transparent' 
              }}
            >
              <Calendar size={20} />
              Timeline
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ 
        flex: 1,
        padding: 'var(--spacing-xl)',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="card fade-in"
              style={{ marginBottom: 'var(--spacing-lg)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Settings</h3>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <input
                    type="checkbox"
                    checked={useGoogleMapsDistances}
                    onChange={(e) => setUseGoogleMapsDistances(e.target.checked)}
                  />
                  Use Google Maps for distance calculations
                </label>
              </div>
              {useGoogleMapsDistances && (
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--spacing-xs)', 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '14px' 
                  }}>
                    Google Maps API Key
                  </label>
                  <input
                    type="password"
                    value={googleMapsApiKey}
                    onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                    placeholder="Enter your Google Maps API key"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all locations?')) {
                      setLocations([]);
                      storage.clearLocations();
                    }
                  }}
                >
                  Clear All Locations
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Route settings */}
        <div className="card fade-in" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--spacing-xs)', 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '14px' 
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={routeDate}
                  onChange={(e) => setRouteDate(e.target.value)}
                  style={{ width: '200px' }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--spacing-xs)', 
                  color: 'var(--color-text-secondary)', 
                  fontSize: '14px' 
                }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: '150px' }}
                />
              </div>
              
              {locations.length > 0 && (
                <div style={{ paddingTop: '20px' }}>
                  <div className="text-secondary" style={{ fontSize: '14px' }}>
                    Total: {Math.round(totalDuration)} min • {totalDistance.toFixed(1)} km
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                className="btn-ghost"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button
                className="btn-secondary"
                onClick={handleOptimizeRoute}
                disabled={locations.length < 2 || isOptimizing}
              >
                <Navigation size={18} />
                {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
              </button>
              
              <button
                className="btn-secondary"
                onClick={() => setShowExportModal(true)}
                disabled={locations.length === 0}
              >
                <Download size={18} />
                Export
              </button>
              
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingLocation(null);
                  setShowAddForm(true);
                }}
              >
                <Plus size={18} />
                Add Location
              </button>
            </div>
          </div>
        </div>

        {/* Content based on view */}
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Add/Edit form */}
              <AnimatePresence>
                {showAddForm && (
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <LocationForm
                      onAdd={handleAddLocation}
                      onCancel={() => {
                        setShowAddForm(false);
                        setEditingLocation(null);
                      }}
                      editLocation={editingLocation || undefined}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* Locations list */}
              {locations.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--spacing-xxl)' }}>
                  <Map size={64} color="var(--color-text-tertiary)" style={{ margin: '0 auto var(--spacing-md)' }} />
                  <h3>No locations added yet</h3>
                  <p className="text-secondary">
                    Start by adding your first open home or appointment location
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={locations}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                      {locations.map((location) => (
                        <SortableLocationCard
                          key={location.id}
                          location={location}
                          onEdit={handleEditLocation}
                          onDelete={handleDeleteLocation}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </motion.div>
          )}

          {view === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RouteMap locations={locations} />
            </motion.div>
          )}

          {view === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {segments.length > 0 ? (
                <RouteTimeline segments={segments} startTime={startTime} />
              ) : (
                <div className="card text-center" style={{ padding: 'var(--spacing-xxl)' }}>
                  <Calendar size={64} color="var(--color-text-tertiary)" style={{ margin: '0 auto var(--spacing-md)' }} />
                  <h3>No route timeline yet</h3>
                  <p className="text-secondary">
                    Add at least two locations to see your route timeline
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        locations={locations}
        date={routeDate}
        startTime={startTime}
        segments={segments}
      />
    </div>
  );
}

export default App;
