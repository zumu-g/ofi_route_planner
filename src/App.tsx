import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Map, 
  List, 
  Download,
  Navigation,
  Calendar,
  Clock,
  Printer,
  X,
  Undo2,
  Redo2,
  Home,
  AlertCircle,
  AlertTriangle
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
  calculateTotalDuration,
  detectRouteConflicts,
  calculateReturnTravelTime
} from './utils/route';
import type { ConflictSummary } from './utils/route';
import { storage } from './utils/storage';
import {
  createHistoryManager,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
} from './utils/history';
import type { HistoryManager } from './utils/history';
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

function SortableLocationCard({ location, onEdit, onDelete, hasConflict, conflictMessages }: any) {
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
        hasConflict={hasConflict}
        conflictMessages={conflictMessages}
      />
    </div>
  );
}

function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [routeDate, setRouteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [view, setView] = useState<'list' | 'map' | 'timeline'>('list');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newRouteDate, setNewRouteDate] = useState(routeDate);
  const [newStartTime, setNewStartTime] = useState(startTime);
  
  // Sprint 2: Return destination state
  const [returnDestination, setReturnDestination] = useState<Location | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnTravelInfo, setReturnTravelInfo] = useState<{ distance: number; duration: number } | null>(null);
  
  // Sprint 2: Undo/redo state
  const [history, setHistory] = useState<HistoryManager>(createHistoryManager());
  
  // Sprint 2: Conflict detection state
  const [conflicts, setConflicts] = useState<ConflictSummary>({
    hasConflicts: false,
    totalConflicts: 0,
    errors: 0,
    warnings: 0,
    conflicts: [],
    affectedLocationIds: new Set(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance to prevent accidental drags on touch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load return destination from storage on mount
  useEffect(() => {
    const savedReturn = storage.loadReturnDestination();
    if (savedReturn) {
      setReturnDestination(savedReturn);
    }
  }, []);

  // Calculate return travel time when locations or return destination changes
  useEffect(() => {
    if (returnDestination && locations.length > 0) {
      const lastLocation = locations[locations.length - 1];
      calculateReturnTravelTime(lastLocation, returnDestination).then((info) => {
        setReturnTravelInfo(info);
      });
    } else {
      setReturnTravelInfo(null);
    }
  }, [locations, returnDestination]);

  // Detect conflicts when locations or segments change
  useEffect(() => {
    const conflictSummary = detectRouteConflicts(locations, segments, startTime);
    setConflicts(conflictSummary);
  }, [locations, segments, startTime]);

  // Generate route segments
  useEffect(() => {
    if (locations.length > 1) {
      generateRouteSegments(locations, startTime).then(setSegments);
    } else {
      setSegments([]);
    }
  }, [locations, startTime]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Redo: Ctrl+Shift+Z
          e.preventDefault();
          handleRedo();
        } else {
          // Undo: Ctrl+Z
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, locations]);

  // History-aware location update
  // Undo handler
  const handleUndo = useCallback(() => {
    const result = undo(history, locations);
    if (result.locations) {
      setHistory(result.history);
      setLocations(result.locations);
    }
  }, [history, locations]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const result = redo(history, locations);
    if (result.locations) {
      setHistory(result.history);
      setLocations(result.locations);
    }
  }, [history, locations]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setHistory(prev => pushState(prev, locations));
      setLocations((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddLocation = (location: Location) => {
    setHistory(prev => pushState(prev, locations));
    if (editingLocation) {
      setLocations(locations.map(loc => loc.id === location.id ? location : loc));
      setEditingLocation(null);
    } else {
      setLocations([...locations, location]);
    }
    setShowAddForm(false);
  };

  const handleDeleteLocation = (id: string) => {
    setHistory(prev => pushState(prev, locations));
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setShowAddForm(true);
  };

  const handleOptimizeRoute = async () => {
    if (locations.length < 2) return;
    
    setHistory(prev => pushState(prev, locations));
    setIsOptimizing(true);
    const optimizedLocations = await optimizeRoute(locations, startTime);
    setLocations(optimizedLocations);
    setIsOptimizing(false);
  };

  // Return destination handlers
  const handleSetReturnDestination = (location: Location) => {
    setReturnDestination(location);
    storage.saveReturnDestination(location);
    setShowReturnForm(false);
  };

  const handleClearReturnDestination = () => {
    setReturnDestination(null);
    storage.clearReturnDestination();
    setReturnTravelInfo(null);
  };

  const totalDistance = calculateTotalDistance(segments);
  const totalDuration = calculateTotalDuration(segments, locations);
  
  // Include return travel time in total if available
  const totalDurationWithReturn = returnTravelInfo 
    ? totalDuration + returnTravelInfo.duration 
    : totalDuration;
  const totalDistanceWithReturn = returnTravelInfo 
    ? totalDistance + returnTravelInfo.distance 
    : totalDistance;

  const handleReschedule = () => {
    setRouteDate(newRouteDate);
    setStartTime(newStartTime);
    setShowRescheduleModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

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
          
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
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
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 var(--spacing-sm)' }} className="no-print" />
            
            <button
              className="btn-ghost no-print"
              onClick={() => {
                setNewRouteDate(routeDate);
                setNewStartTime(startTime);
                setShowRescheduleModal(true);
              }}
              disabled={locations.length === 0}
              title="Reschedule Route"
            >
              <Clock size={20} />
              Reschedule
            </button>
            <button
              className="btn-ghost no-print"
              onClick={handlePrint}
              disabled={locations.length === 0}
              title="Print Route"
            >
              <Printer size={20} />
              Print
            </button>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 var(--spacing-sm)' }} className="no-print" />
            
            <button
              className="btn-ghost no-print"
              onClick={handleUndo}
              disabled={!canUndo(history)}
              title="Undo (Ctrl+Z)"
              style={{ padding: '8px 12px' }}
            >
              <Undo2 size={20} />
            </button>
            <button
              className="btn-ghost no-print"
              onClick={handleRedo}
              disabled={!canRedo(history)}
              title="Redo (Ctrl+Shift+Z)"
              style={{ padding: '8px 12px' }}
            >
              <Redo2 size={20} />
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
                    Total: {Math.round(totalDurationWithReturn)} min • {totalDistanceWithReturn.toFixed(1)} km
                    {returnTravelInfo && (
                      <span style={{ marginLeft: '8px', color: 'var(--color-royal-blue)' }}>
                        (includes return)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
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
                onClick={() => setShowReturnForm(true)}
                title={returnDestination ? 'Change return destination' : 'Set return destination'}
              >
                <Home size={18} />
                {returnDestination ? 'Return Set' : 'Set Return'}
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

        {/* Conflict Warnings Banner */}
        {conflicts.hasConflicts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{
              marginBottom: 'var(--spacing-lg)',
              backgroundColor: conflicts.errors > 0 ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 149, 0, 0.1)',
              border: `1px solid ${conflicts.errors > 0 ? 'rgba(255, 59, 48, 0.3)' : 'rgba(255, 149, 0, 0.3)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
              {conflicts.errors > 0 ? (
                <AlertCircle size={24} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertTriangle size={24} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 var(--spacing-xs) 0', color: conflicts.errors > 0 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                  {conflicts.errors > 0 ? 'Schedule Conflicts Detected' : 'Schedule Warnings'}
                </h4>
                <p className="text-secondary" style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '14px' }}>
                  {conflicts.errors > 0 && `${conflicts.errors} error${conflicts.errors > 1 ? 's' : ''}`}
                  {conflicts.errors > 0 && conflicts.warnings > 0 && ' and '}
                  {conflicts.warnings > 0 && `${conflicts.warnings} warning${conflicts.warnings > 1 ? 's' : ''}`}
                  {' found in your route.'}
                </p>
                <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)', fontSize: '14px' }}>
                  {conflicts.conflicts.slice(0, 3).map((conflict, idx) => (
                    <li key={idx} style={{ color: conflict.severity === 'error' ? 'var(--color-danger)' : 'var(--color-warning)', marginBottom: '4px' }}>
                      {conflict.message}
                    </li>
                  ))}
                  {conflicts.conflicts.length > 3 && (
                    <li className="text-secondary">...and {conflicts.conflicts.length - 3} more</li>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Return Destination Panel */}
        {returnDestination && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{
              marginBottom: 'var(--spacing-lg)',
              backgroundColor: 'rgba(0, 122, 255, 0.05)',
              border: '1px solid rgba(0, 122, 255, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <Home size={20} color="var(--color-royal-blue)" />
                <div>
                  <span style={{ fontWeight: 500 }}>Return to: </span>
                  <span className="text-secondary">{returnDestination.name || returnDestination.address}</span>
                  {returnTravelInfo && locations.length > 0 && (
                    <span style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-royal-blue)', fontSize: '14px' }}>
                      (+{Math.round(returnTravelInfo.duration)} min, {returnTravelInfo.distance.toFixed(1)} km)
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setShowReturnForm(true)}
                  style={{ padding: '8px' }}
                >
                  Edit
                </button>
                <button
                  className="btn-ghost"
                  onClick={handleClearReturnDestination}
                  style={{ padding: '8px', color: 'var(--color-danger)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
                      {locations.map((location) => {
                        const locationConflicts = conflicts.conflicts.filter(c => c.locationId === location.id);
                        return (
                          <SortableLocationCard
                            key={location.id}
                            location={location}
                            onEdit={handleEditLocation}
                            onDelete={handleDeleteLocation}
                            hasConflict={conflicts.affectedLocationIds.has(location.id)}
                            conflictMessages={locationConflicts.map(c => c.message)}
                          />
                        );
                      })}
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
        returnDestination={returnDestination}
        returnTravelInfo={returnTravelInfo}
      />

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showRescheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowRescheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{
                width: '100%',
                maxWidth: '400px',
                margin: 'var(--spacing-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3>Reschedule Route</h3>
                <button
                  className="btn-ghost"
                  onClick={() => setShowRescheduleModal(false)}
                  style={{ padding: '8px' }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--spacing-xs)', 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '14px' 
                  }}>
                    New Date
                  </label>
                  <input
                    type="date"
                    value={newRouteDate}
                    onChange={(e) => setNewRouteDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--spacing-xs)', 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '14px' 
                  }}>
                    New Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowRescheduleModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleReschedule}
                  >
                    <Clock size={18} />
                    Apply Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Destination Modal */}
      <AnimatePresence>
        {showReturnForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowReturnForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{
                width: '100%',
                maxWidth: '500px',
                margin: 'var(--spacing-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h3>Set Return Destination</h3>
                <button
                  className="btn-ghost"
                  onClick={() => setShowReturnForm(false)}
                  style={{ padding: '8px' }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)', fontSize: '14px' }}>
                Set where you need to return after completing your route (e.g., home or office).
              </p>
              
              <LocationForm
                onAdd={handleSetReturnDestination}
                onCancel={() => setShowReturnForm(false)}
                editLocation={returnDestination || undefined}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
