import API_BASE_URL from '../../config/api';

const ApiDebug = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <strong>API Base URL:</strong> {API_BASE_URL}
    </div>
  );
};

export default ApiDebug;