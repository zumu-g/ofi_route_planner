import React from 'react';
import { MapPin, Clock, Timer, Edit2, Trash2, GripVertical, Navigation, CalendarClock, AlertTriangle } from 'lucide-react';
import type { Location } from '../types';
import { motion } from 'framer-motion';

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  hasConflict?: boolean;
  conflictMessages?: string[];
}

export const LocationCard: React.FC<LocationCardProps> = ({ 
  location, 
  onEdit, 
  onDelete,
  isDragging = false,
  hasConflict = false,
  conflictMessages = [],
}) => {
  return (
    <motion.div
      className="card"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        gap: 'var(--spacing-md)',
        alignItems: 'center',
        ...(hasConflict && {
          border: '2px solid var(--color-warning)',
          backgroundColor: 'rgba(255, 149, 0, 0.05)',
        }),
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div style={{ color: 'var(--color-text-tertiary)', cursor: 'grab' }}>
        <GripVertical size={20} />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
          <span 
            style={{ 
              padding: '2px 8px', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: location.type === 'openHome' ? 'var(--color-royal-blue)' : 'var(--color-warning)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {location.type === 'openHome' ? 'Open Home' : 'Appointment'}
          </span>
          {location.name && <h4 style={{ margin: 0 }}>{location.name}</h4>}
        </div>
        
        <p style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          color: 'var(--color-text-secondary)',
          margin: '4px 0'
        }}>
          <MapPin size={16} />
          {location.address}
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: 'var(--spacing-lg)', 
          color: 'var(--color-text-tertiary)',
          fontSize: '14px',
          marginTop: 'var(--spacing-sm)',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <Clock size={14} />
            {location.duration} min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <Timer size={14} />
            {location.buffer} min buffer
          </span>
          {location.fixedTime && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)',
              color: 'var(--color-royal-blue)',
              fontWeight: 500
            }}>
              <CalendarClock size={14} />
              Fixed: {location.fixedTime}
            </span>
          )}
          {location.startTime && (
            <span>{location.startTime} - {location.endTime}</span>
          )}
        </div>
        
        {location.notes && (
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: '14px',
            marginTop: 'var(--spacing-sm)',
            fontStyle: 'italic'
          }}>
            {location.notes}
          </p>
        )}
        
        {/* Conflict Warning */}
        {hasConflict && conflictMessages.length > 0 && (
          <div style={{
            marginTop: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'rgba(255, 149, 0, 0.1)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-sm)',
          }}>
            <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {conflictMessages.map((msg, idx) => (
                <div key={idx}>{msg}</div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
        {location.coordinates && (
          <>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ padding: '8px', textDecoration: 'none', fontSize: '12px' }}
              title="Open in Google Maps"
            >
              <Navigation size={16} />
              <span style={{ marginLeft: '4px' }}>Google</span>
            </a>
            <a 
              href={`https://maps.apple.com/?daddr=${location.coordinates.lat},${location.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ padding: '8px', textDecoration: 'none', fontSize: '12px' }}
              title="Open in Apple Maps"
            >
              <Navigation size={16} />
              <span style={{ marginLeft: '4px' }}>Apple</span>
            </a>
          </>
        )}
        <button 
          className="btn-ghost" 
          onClick={() => onEdit(location)}
          style={{ padding: '8px' }}
        >
          <Edit2 size={18} />
        </button>
        <button 
          className="btn-ghost" 
          onClick={() => onDelete(location.id)}
          style={{ padding: '8px', color: 'var(--color-danger)' }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};