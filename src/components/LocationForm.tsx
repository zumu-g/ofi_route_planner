import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Timer, Plus, X } from 'lucide-react';
import { Location } from '../types';
import { geocodeAddress } from '../utils/geocoding';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationFormProps {
  onAdd: (location: Location) => void;
  onCancel: () => void;
  editLocation?: Location;
}

export const LocationForm: React.FC<LocationFormProps> = ({ onAdd, onCancel, editLocation }) => {
  const [formData, setFormData] = useState<Partial<Location>>({
    address: '',
    name: '',
    duration: 30,
    buffer: 15,
    notes: '',
    type: 'openHome',
    ...editLocation,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address) return;
    
    setIsGeocoding(true);
    
    let coordinates = formData.coordinates;
    if (!coordinates) {
      const geocodeResult = await geocodeAddress(formData.address);
      if (geocodeResult) {
        coordinates = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
        };
      }
    }
    
    setIsGeocoding(false);
    
    const location: Location = {
      id: editLocation?.id || Date.now().toString(),
      address: formData.address,
      name: formData.name,
      duration: formData.duration || 30,
      buffer: formData.buffer || 15,
      notes: formData.notes,
      type: formData.type as 'openHome' | 'appointment',
      coordinates,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };
    
    onAdd(location);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card"
      onSubmit={handleSubmit}
    >
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h3>{editLocation ? 'Edit Location' : 'Add New Location'}</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Location Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'openHome' | 'appointment' })}
          >
            <option value="openHome">Open Home</option>
            <option value="appointment">Appointment</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Smith Residence"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Address
          </label>
          <input
            type="text"
            placeholder="123 Main St, City"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={formData.duration || 30}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              <Timer size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Buffer (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={formData.buffer || 15}
              onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </div>
        
        {formData.type === 'appointment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Any additional information..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            <X size={18} />
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isGeocoding}>
            {isGeocoding ? (
              <>Loading...</>
            ) : (
              <>
                <Plus size={18} />
                {editLocation ? 'Update' : 'Add'} Location
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};