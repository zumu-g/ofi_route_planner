import React from 'react';
import { Clock, MapPin, Car } from 'lucide-react';
import type { RouteSegment } from '../types';
import { motion } from 'framer-motion';

interface RouteTimelineProps {
  segments: RouteSegment[];
  startTime: string;
}

export const RouteTimeline: React.FC<RouteTimelineProps> = ({ segments, startTime }) => {
  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Route Timeline</h3>
      
      <div style={{ position: 'relative' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '30px',
          bottom: '30px',
          width: '2px',
          backgroundColor: 'var(--color-border)',
        }} />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {/* Start point */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-royal-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}>
              <Clock size={20} />
            </div>
            <div>
              <strong>Start</strong>
              <p className="text-secondary">{startTime}</p>
            </div>
          </div>
          
          {/* Segments */}
          {segments.map((segment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Location */}
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-royal-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <MapPin size={20} color="var(--color-royal-blue)" />
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{segment.from.name || segment.from.address}</strong>
                  <p className="text-secondary">{segment.from.address}</p>
                  <p className="text-tertiary" style={{ fontSize: '14px' }}>
                    Duration: {segment.from.duration} min
                    {segment.from.buffer > 0 && ` • Buffer: ${segment.from.buffer} min`}
                  </p>
                  <p className="text-tertiary" style={{ fontSize: '14px' }}>
                    Depart: {segment.departureTime}
                  </p>
                </div>
              </div>
              
              {/* Travel */}
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{
                  width: '40px',
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <Car size={16} color="var(--color-text-tertiary)" />
                </div>
                <div>
                  <p className="text-tertiary" style={{ fontSize: '14px' }}>
                    Travel time: {Math.round(segment.duration)} min • {segment.distance.toFixed(1)} km
                  </p>
                  <p className="text-tertiary" style={{ fontSize: '14px' }}>
                    Arrive: {segment.arrivalTime}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Final destination */}
          {segments.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <strong>{segments[segments.length - 1].to.name || segments[segments.length - 1].to.address}</strong>
                <p className="text-secondary">{segments[segments.length - 1].to.address}</p>
                <p className="text-tertiary" style={{ fontSize: '14px' }}>
                  Duration: {segments[segments.length - 1].to.duration} min
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};