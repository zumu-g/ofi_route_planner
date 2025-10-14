import React, { useState } from 'react';
import { X, Save, FolderOpen, Trash2, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../utils/storage';
import type { Location } from '../types';
import { format } from 'date-fns';

interface SavedRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocations: Location[];
  onLoadRoute: (locations: Location[], routeDate?: string, startTime?: string) => void;
  routeDate?: string;
  startTime?: string;
}

export const SavedRoutesModal: React.FC<SavedRoutesModalProps> = ({
  isOpen,
  onClose,
  currentLocations,
  onLoadRoute,
  routeDate,
  startTime
}) => {
  const [savedRoutes, setSavedRoutes] = useState(() => storage.loadSavedRoutes());
  const [routeName, setRouteName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleSaveRoute = () => {
    if (!routeName.trim() || currentLocations.length === 0) return;

    const newRoute = {
      id: Date.now().toString(),
      name: routeName,
      locations: currentLocations,
      savedAt: new Date().toISOString(),
      routeDate,
      startTime
    };

    storage.saveSavedRoute(newRoute);
    setSavedRoutes(storage.loadSavedRoutes());
    setRouteName('');
    setShowSaveForm(false);
  };

  const handleDeleteRoute = (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      storage.deleteSavedRoute(id);
      setSavedRoutes(storage.loadSavedRoutes());
    }
  };

  const handleLoadRoute = (route: typeof savedRoutes[0]) => {
    onLoadRoute(route.locations, route.routeDate, route.startTime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          padding: 'var(--spacing-lg)',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ margin: 0 }}>Saved Routes</h2>
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '8px' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{
            padding: 'var(--spacing-lg)',
            flex: 1,
            overflowY: 'auto',
          }}>
            {/* Save current route section */}
            {currentLocations.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                {!showSaveForm ? (
                  <button
                    className="btn-primary"
                    onClick={() => setShowSaveForm(true)}
                    style={{ width: '100%' }}
                  >
                    <Save size={18} />
                    Save Current Route ({currentLocations.length} locations)
                  </button>
                ) : (
                  <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--color-background)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-md)',
                  }}>
                    <input
                      type="text"
                      placeholder="Enter route name..."
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveRoute()}
                      style={{ marginBottom: 'var(--spacing-sm)' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        className="btn-primary"
                        onClick={handleSaveRoute}
                        disabled={!routeName.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowSaveForm(false);
                          setRouteName('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Saved routes list */}
            <div>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Available Routes</h3>
              {savedRoutes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No saved routes yet. Save your current route to reuse it later!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {savedRoutes.map((route) => (
                    <div
                      key={route.id}
                      style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: 'var(--spacing-sm)',
                      }}>
                        <div>
                          <h4 style={{ margin: 0, marginBottom: '4px' }}>{route.name}</h4>
                          <div style={{
                            fontSize: '14px',
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            flexWrap: 'wrap',
                          }}>
                            <span>{route.locations.length} locations</span>
                            <span>Saved {format(new Date(route.savedAt), 'MMM d, yyyy')}</span>
                            {route.routeDate && (
                              <span>
                                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                {format(new Date(route.routeDate), 'MMM d')}
                              </span>
                            )}
                            {route.startTime && (
                              <span>
                                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                {route.startTime}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => handleLoadRoute(route)}
                            style={{ padding: '8px 16px' }}
                          >
                            <FolderOpen size={16} />
                            Load
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => handleDeleteRoute(route.id)}
                            style={{ padding: '8px', color: 'var(--color-error)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Preview of locations */}
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--color-text-tertiary)',
                        marginTop: 'var(--spacing-sm)',
                      }}>
                        {route.locations.slice(0, 3).map((loc, idx) => (
                          <div key={idx}>{loc.name || loc.address}</div>
                        ))}
                        {route.locations.length > 3 && (
                          <div>...and {route.locations.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};