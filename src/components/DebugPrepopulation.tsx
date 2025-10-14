import React, { useEffect, useState } from 'react';
import { storage } from '../utils/storage';

export const DebugPrepopulation: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  useEffect(() => {
    const checkStorage = () => {
      const raw = localStorage.getItem('ofi-route-planner-last-location');
      const loaded = storage.loadLastLocation();
      
      setDebugInfo({
        rawLocalStorage: raw,
        parsedData: loaded,
        hasData: !!raw,
        timestamp: new Date().toISOString(),
        allKeys: Object.keys(localStorage).filter(k => k.includes('ofi'))
      });
    };
    
    checkStorage();
    
    // Listen for storage changes
    window.addEventListener('storage', checkStorage);
    
    // Check every second
    const interval = setInterval(checkStorage, 1000);
    
    return () => {
      window.removeEventListener('storage', checkStorage);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'black',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <strong>🐛 Prepopulation Debug</strong>
      <pre style={{ margin: '5px 0' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <button onClick={() => {
        localStorage.removeItem('ofi-route-planner-last-location');
        console.log('Cleared prepopulation data');
      }}>
        Clear Storage
      </button>
    </div>
  );
};