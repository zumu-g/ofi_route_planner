import React, { useState } from 'react';
import { Calendar, Smartphone, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Location, ExportOptions } from '../types';
import { createCalendarEvent, exportCalendarEvents } from '../utils/calendar';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  date: string;
  startTime: string;
  segments: any[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  locations,
  date,
  startTime,
  segments,
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'ics',
    includeBuffers: true,
    includeNotes: true,
  });

  const handleExport = () => {
    const events = locations.map((location, index) => {
      let eventStartTime = startTime;
      
      if (index > 0 && segments[index - 1]) {
        eventStartTime = segments[index - 1].arrivalTime;
      }
      
      return createCalendarEvent(location, date, eventStartTime);
    });

    exportCalendarEvents(events, exportOptions);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
              zIndex: 999,
            }}
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '500px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              padding: 'var(--spacing-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h2>Export Route</h2>
              <button className="btn-ghost" onClick={onClose} style={{ padding: '8px' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                  Export Format
                </label>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <label style={{ 
                    flex: 1, 
                    padding: 'var(--spacing-md)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    backgroundColor: exportOptions.format === 'ics' ? 'var(--color-royal-blue)' : 'transparent',
                    color: exportOptions.format === 'ics' ? 'white' : 'inherit',
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="ics"
                      checked={exportOptions.format === 'ics'}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as any })}
                      style={{ display: 'none' }}
                    />
                    <Calendar size={20} style={{ display: 'block', margin: '0 auto var(--spacing-xs)' }} />
                    ICS File
                  </label>
                  
                  <label style={{ 
                    flex: 1, 
                    padding: 'var(--spacing-md)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    backgroundColor: exportOptions.format === 'google' ? 'var(--color-royal-blue)' : 'transparent',
                    color: exportOptions.format === 'google' ? 'white' : 'inherit',
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="google"
                      checked={exportOptions.format === 'google'}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as any })}
                      style={{ display: 'none' }}
                    />
                    <Calendar size={20} style={{ display: 'block', margin: '0 auto var(--spacing-xs)' }} />
                    Google Calendar
                  </label>
                  
                  <label style={{ 
                    flex: 1, 
                    padding: 'var(--spacing-md)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    backgroundColor: exportOptions.format === 'apple' ? 'var(--color-royal-blue)' : 'transparent',
                    color: exportOptions.format === 'apple' ? 'white' : 'inherit',
                  }}>
                    <input
                      type="radio"
                      name="format"
                      value="apple"
                      checked={exportOptions.format === 'apple'}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as any })}
                      style={{ display: 'none' }}
                    />
                    <Smartphone size={20} style={{ display: 'block', margin: '0 auto var(--spacing-xs)' }} />
                    Apple Calendar
                  </label>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeBuffers}
                    onChange={(e) => setExportOptions({ ...exportOptions, includeBuffers: e.target.checked })}
                  />
                  Include buffer times in calendar events
                </label>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeNotes}
                    onChange={(e) => setExportOptions({ ...exportOptions, includeNotes: e.target.checked })}
                  />
                  Include notes in calendar events
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleExport} style={{ flex: 1 }}>
                  <Download size={18} />
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};