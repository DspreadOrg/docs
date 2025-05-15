import React from 'react';

export default function LastUpdated({ date }) {
  return (
    <div style={{ 
      fontSize: '0.875rem', 
      color: '#6b7280', 
      marginTop: '2rem' 
    }}>
      Last updated {date}
    </div>
  );
}
