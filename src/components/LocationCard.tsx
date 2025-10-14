import React from 'react';
import { MapPin, Clock, Timer, Edit2, Trash2, GripVertical, Navigation, ArrowRight } from 'lucide-react';
import type { Location } from '../types';
import { motion } from 'framer-motion';

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  arrivalTime?: string;
  departureTime?: string;
  travelTime?: number;
  travelDistance?: number;
  isFirst?: boolean;
  isLast?: boolean;
  dragHandleProps?: any;
}

export const LocationCard: React.FC<LocationCardProps> = ({ 
  location, 
  onEdit, 
  onDelete,
  isDragging = false,
  arrivalTime,
  departureTime,
  travelTime,
  travelDistance,
  isFirst = false,
  isLast = false,
  dragHandleProps
}) => {
  return (
    <>
      {/* Travel time from previous location */}
      {!isFirst && travelTime !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            margin: 'var(--spacing-md) 0',
            color: 'var(--color-text-secondary)',
            fontSize: '14px'
          }}
        >
          <Navigation size={16} />
          <span>{Math.round(travelTime)} min</span>
          {travelDistance !== undefined && (
            <>
              <span>•</span>
              <span>{travelDistance.toFixed(1)} km</span>
            </>
          )}
          <ArrowRight size={16} />
        </motion.div>
      )}

      <motion.div
        className="card"
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          gap: 'var(--spacing-md)',
          alignItems: 'center',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
      <div style={{ color: 'var(--color-text-tertiary)', cursor: 'grab' }} {...dragHandleProps}>
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
          {arrivalTime && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'var(--color-primary)'
            }}>
              {arrivalTime}
            </span>
          )}
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
          marginTop: 'var(--spacing-sm)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <Clock size={14} />
            {location.duration} min
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
            <Timer size={14} />
            {location.buffer} min buffer
          </span>
          {location.startTime && (
            <span>{location.startTime} - {location.endTime}</span>
          )}
          {departureTime && !isLast && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
              <ArrowRight size={14} />
              Depart: {departureTime}
            </span>
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
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <button 
          className="btn-ghost" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(location);
          }}
          style={{ padding: '8px' }}
        >
          <Edit2 size={18} />
        </button>
        <button 
          className="btn-ghost" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(location.id);
          }}
          style={{ padding: '8px', color: 'var(--color-danger)' }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
    </>
  );
};