import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Timer, Plus, X } from 'lucide-react';
import { Location } from '../types';
import { geocodeAddress } from '../utils/geocoding';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

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
    setGeocodeError(null);
    
    let coordinates = formData.coordinates;
    let hadGeocodeError = false;
    
    if (!coordinates) {
      const geocodeResult = await geocodeAddress(formData.address);
      if (geocodeResult) {
        coordinates = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
        };
      } else {
        // Set error message if geocoding failed
        hadGeocodeError = true;
        setGeocodeError('Could not find coordinates for this address. The location will be added without map coordinates.');
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
    
    // Clear error after a short delay if it was set
    if (hadGeocodeError) {
      setTimeout(() => setGeocodeError(null), 5000);
    }
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
                
                // Real Victorian suburbs with postcodes
                const melbourneSuburbs = [
                  'Toorak VIC 3142', 'South Yarra VIC 3141', 'Richmond VIC 3121', 
                  'Prahran VIC 3181', 'St Kilda VIC 3182', 'Brighton VIC 3186',
                  'Hawthorn VIC 3122', 'Camberwell VIC 3124', 'Malvern VIC 3144',
                  'Caulfield VIC 3162', 'Glen Iris VIC 3146', 'Armadale VIC 3143'
                ];
                
                // Real street name patterns and completions
                const streetCompletions = {
                  'gl': ['Gloucester Street', 'Glen Street', 'Glenferrie Road', 'Glenhuntly Road'],
                  'br': ['Brunswick Street', 'Bridge Road', 'Brighton Road', 'Burke Road'],
                  'ch': ['Chapel Street', 'Church Street', 'Churchill Avenue', 'Charles Street'],
                  'co': ['Collins Street', 'Commercial Road', 'Coorong Road', 'Cotham Road'],
                  'ha': ['High Street', 'Hawthorn Road', 'Hampton Street', 'Harris Street'],
                  'ma': ['Main Street', 'Malvern Road', 'Manchester Street', 'Marine Parade'],
                  'st': ['St Kilda Road', 'Station Street', 'Sturt Street', 'Stanley Street'],
                  'sw': ['Swan Street', 'Swanston Street', 'Sweet Street', 'Sydney Road']
                };
                
                // Find matching street names based on input
                let matchingStreets: string[] = [];
                for (const [prefix, streets] of Object.entries(streetCompletions)) {
                  if (input.includes(prefix)) {
                    matchingStreets = streets;
                    break;
                  }
                }
                
                // If specific street matches found, use them
                if (matchingStreets.length > 0) {
                  matchingStreets.forEach(street => {
                    melbourneSuburbs.slice(0, 4).forEach(suburb => {
                      suggestions.push(`${newAddress.split(' ')[0]} ${street}, ${suburb}`);
                    });
                  });
                } else {
                  // General suggestions with common street types
                  const commonStreets = ['Street', 'Avenue', 'Road', 'Grove', 'Court'];
                  commonStreets.forEach(type => {
                    melbourneSuburbs.slice(0, 3).forEach(suburb => {
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
          
          {/* Geocode error display */}
          {geocodeError && (
            <div style={{ 
              marginTop: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm)', 
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px'
            }}>
              {geocodeError}
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