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
  const [addressSuggestion, setAddressSuggestion] = useState<string>('');

  useEffect(() => {
    console.log('[v2] LocationForm mounted/updated. EditLocation:', editLocation);
    // Load last location data when form opens for new location
    if (!editLocation) {
      // Small delay to ensure localStorage is up to date
      setTimeout(() => {
        const lastLocation = storage.loadLastLocation();
        console.log('[v2] Loading last location data for prepopulation:', lastLocation);
        console.log('[v2] Raw localStorage:', localStorage.getItem('ofi-route-planner-last-location'));
        
        if (lastLocation && (lastLocation.city || lastLocation.suburb)) {
          const parts = [];
          if (lastLocation.suburb) parts.push(lastLocation.suburb);
          if (lastLocation.city) parts.push(lastLocation.city);
          if (lastLocation.state && lastLocation.postcode) {
            parts.push(`${lastLocation.state} ${lastLocation.postcode}`);
          } else if (lastLocation.postcode) {
            parts.push(lastLocation.postcode);
          }
          const suggestion = parts.join(', ');
          setAddressSuggestion(suggestion);
          console.log('Address suggestion set:', suggestion);
        } else {
          console.log('No previous location data found for prepopulation');
        }
      }, 100);
    } else {
      // Clear suggestion when editing
      setAddressSuggestion('');
    }
  }, [editLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address) return;
    
    setIsGeocoding(true);
    
    let coordinates = formData.coordinates;
    if (!coordinates) {
      console.log('Geocoding address:', formData.address);
      const geocodeResult = await geocodeAddress(formData.address);
      if (geocodeResult) {
        coordinates = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
        };
        console.log('Geocoding successful:', coordinates);
      } else {
        console.error('Geocoding failed for address:', formData.address);
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
    
    // Save the address details for future prepopulation
    console.log('[v2] Saving location address for prepopulation:', location.address);
    storage.saveLastLocation(location.address);
    console.log('[v2] After save, localStorage contains:', localStorage.getItem('ofi-route-planner-last-location'));
    
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
            {addressSuggestion && !formData.address && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, address: addressSuggestion })}
                style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  padding: '2px 8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Use {addressSuggestion}
              </button>
            )}
          </label>
          <input
            type="text"
            placeholder={addressSuggestion ? `e.g., 123 Main St, ${addressSuggestion}` : "123 Main St, City"}
            value={formData.address || ''}
            onChange={(e) => {
              const newAddress = e.target.value;
              setFormData({ ...formData, address: newAddress });
              
              // Auto-append suggestion if user types a street number/name
              if (addressSuggestion && newAddress && !newAddress.includes(',')) {
                const words = newAddress.trim().split(' ');
                const hasNumber = /^\d+/.test(words[0] || '');
                const hasStreetName = words.length >= 2 && words[1].length >= 2;
                const lastWord = words[words.length - 1]?.toLowerCase() || '';
                
                // Common street types that indicate the address is complete
                const streetTypes = ['st', 'street', 'rd', 'road', 'ave', 'avenue', 'dr', 'drive', 'ct', 'court', 'pl', 'place', 'way', 'lane', 'ln', 'blvd', 'boulevard', 'cres', 'crescent', 'tce', 'terrace', 'pde', 'parade'];
                
                // Check if the last word is a street type or if user added extra space
                if (hasNumber && hasStreetName && (streetTypes.includes(lastWord) || newAddress.endsWith('  ') || newAddress.endsWith(', '))) {
                  setFormData({ ...formData, address: `${newAddress.trim()}, ${addressSuggestion}` });
                }
              }
            }}
            onKeyDown={(e) => {
              // Auto-complete with Tab key
              if (e.key === 'Tab' && addressSuggestion && formData.address && !formData.address.includes(',')) {
                const hasNumber = /^\d+\s/.test(formData.address);
                const hasStreetName = formData.address.trim().split(' ').length >= 2;
                if (hasNumber && hasStreetName) {
                  e.preventDefault();
                  setFormData({ ...formData, address: `${formData.address.trim()}, ${addressSuggestion}` });
                }
              }
            }}
            required
          />
          {addressSuggestion && (
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              marginTop: '4px'
            }}>
              {formData.address && !formData.address.includes(',') && /^\d+\s/.test(formData.address) ? (
                <>Tab to auto-complete: {formData.address.trim()}, {addressSuggestion}</>
              ) : (
                <>Based on your last location: {addressSuggestion}</>
              )}
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