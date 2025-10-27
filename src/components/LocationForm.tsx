import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Timer, Plus, X } from 'lucide-react';
import type { Location } from '../types';
import { geocodeAddress } from '../utils/geocoding';
import { motion } from 'framer-motion';
import { storage } from '../utils/storage';

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
  const [lastSuburb, setLastSuburb] = useState<string>('');

  useEffect(() => {
    console.log('🔍 LocationForm useEffect - editLocation:', editLocation);
    if (!editLocation) {
      const savedSuburb = storage.loadLastSuburb();
      console.log('🔍 Loaded suburb from storage:', savedSuburb);
      if (savedSuburb) {
        setLastSuburb(savedSuburb);
        console.log('🔍 Set lastSuburb state to:', savedSuburb);
      }
    }
  }, [editLocation]);

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
      } else {
        alert('Could not find coordinates for this address. Please check the address and try again.');
        setIsGeocoding(false);
        return;
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
    
    // Extract and save the suburb/city for future prepopulation
    const addressParts = location.address.split(',');
    console.log('🔍 Address parts:', addressParts);
    if (addressParts.length >= 2) {
      // Get the suburb/city part (usually after the first comma)
      const suburb = addressParts.slice(1).join(',').trim();
      console.log('🔍 Extracted suburb:', suburb);
      if (suburb) {
        storage.saveLastSuburb(suburb);
        console.log('🔍 Saved suburb to storage:', suburb);
      }
    }
    
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
          
          {/* DEBUG INFO */}
          <div style={{ 
            background: '#ffeb3b', 
            padding: '8px', 
            marginBottom: '8px', 
            fontSize: '12px',
            border: '2px solid #f57c00',
            borderRadius: '4px'
          }}>
            <strong>🐛 DEBUG:</strong><br/>
            lastSuburb state: "{lastSuburb}"<br/>
            lastSuburb length: {lastSuburb.length}<br/>
            Button should show: {lastSuburb ? 'YES' : 'NO'}
          </div>
          
          <input
            type="text"
            placeholder={lastSuburb ? `e.g., 123 Main St, ${lastSuburb}` : "123 Main St, City"}
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          {lastSuburb && (
            console.log('🔍 Rendering auto-population button with lastSuburb:', lastSuburb),
            <div style={{
              fontSize: '13px',
              marginTop: '6px'
            }}>
              <button
                type="button"
                onClick={() => {
                  // Pre-fill with a template using the last suburb
                  setFormData({ ...formData, address: `, ${lastSuburb}` });
                  // Focus the input so user can type the street address
                  setTimeout(() => {
                    const inputs = document.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
                    const addressInput = inputs[1]; // Second input is the address field
                    if (addressInput) {
                      addressInput.focus();
                      addressInput.setSelectionRange(0, 0);
                    }
                  }, 0);
                }}
                style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📍 Use previous location: {lastSuburb}
              </button>
            </div>
          )}
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