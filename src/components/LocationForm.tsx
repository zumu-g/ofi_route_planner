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
  const [currentSuburb, setCurrentSuburb] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

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
        
        <div style={{ position: 'relative' }}>
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
            currentSuburb: "{currentSuburb}"<br/>
            address: "{formData.address || ''}"<br/>
            word count: {formData.address ? formData.address.trim().split(/\s+/).length : 0}<br/>
            Live button should show: {currentSuburb && formData.address && formData.address.trim().length >= 2 && !formData.address.includes(',') ? 'YES' : 'NO'}<br/>
            <button 
              type="button" 
              onClick={() => {
                storage.saveLastSuburb('Test Suburb, VIC 3000');
                setLastSuburb('Test Suburb, VIC 3000');
              }}
              style={{ fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}
            >
              Set Test Suburb
            </button>
            <button 
              type="button" 
              onClick={() => {
                const loaded = storage.loadLastSuburb();
                setLastSuburb(loaded);
                alert('Loaded: ' + loaded);
              }}
              style={{ fontSize: '10px', padding: '2px 6px', marginTop: '4px', marginLeft: '4px' }}
            >
              Reload Suburb
            </button>
          </div>
          
          <input
            type="text"
            placeholder={lastSuburb ? `e.g., 123 Main St, ${lastSuburb}` : "123 Main St, City"}
            value={formData.address || ''}
            onChange={(e) => {
              const newAddress = e.target.value;
              setFormData({ ...formData, address: newAddress });
              
              // Generate address suggestions as user types
              const input = newAddress.trim().toLowerCase();
              
              if (input.length >= 3 && !newAddress.includes(',')) {
                // Generate realistic Melbourne/Victoria address suggestions
                const suggestions: string[] = [];
                
                // Common Victorian suburbs and street patterns
                const suburbs = ['Toorak VIC 3142', 'South Yarra VIC 3141', 'Richmond VIC 3121', 'Prahran VIC 3181', 'St Kilda VIC 3182'];
                const streetTypes = ['Street', 'Avenue', 'Road', 'Lane', 'Court'];
                
                // If user typed "3a gl" suggest gloucester variations
                if (input.includes('gl')) {
                  streetTypes.forEach(type => {
                    suburbs.forEach(suburb => {
                      suggestions.push(`${newAddress.trim()} Gloucester ${type}, ${suburb}`);
                    });
                  });
                }
                
                // General suggestions based on what they've typed
                if (suggestions.length === 0) {
                  streetTypes.forEach(type => {
                    suburbs.slice(0, 3).forEach(suburb => {
                      suggestions.push(`${newAddress.trim()} ${type}, ${suburb}`);
                    });
                  });
                }
                
                setAddressSuggestions(suggestions.slice(0, 8)); // Show max 8 suggestions
                setCurrentSuburb('');
              } else {
                setAddressSuggestions([]);
                setCurrentSuburb('');
              }
            }}
            required
          />
          
          {/* Live auto-population based on previously saved suburb */}
          {lastSuburb && !formData.address && (
            <div style={{
              fontSize: '13px',
              marginTop: '6px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, address: `, ${lastSuburb}` });
                  setTimeout(() => {
                    const inputs = document.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
                    const addressInput = inputs[1];
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
          
          {/* Address suggestions dropdown */}
          {addressSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {addressSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setFormData({ ...formData, address: suggestion });
                    setAddressSuggestions([]);
                    // Extract and save suburb for future use
                    const parts = suggestion.split(',');
                    if (parts.length >= 2) {
                      const suburb = parts.slice(1).join(',').trim();
                      storage.saveLastSuburb(suburb);
                      setLastSuburb(suburb);
                    }
                  }}
                  style={{
                    padding: '12px',
                    borderBottom: index < addressSuggestions.length - 1 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  📍 {suggestion}
                </div>
              ))}
            </div>
          )}
          
          {/* Live auto-population - show as soon as user types */}
          {currentSuburb && formData.address && formData.address.trim().length >= 2 && !formData.address.includes(',') && (
            <div style={{
              fontSize: '13px',
              marginTop: '6px',
              padding: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                💡 Complete address: <strong>{formData.address}, {currentSuburb}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Complete the address with the saved suburb
                  setFormData({ ...formData, address: `${formData.address}, ${currentSuburb}` });
                  setCurrentSuburb('');
                }}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ✅ Use this address
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