const SimpleEmptyBox = ({ message = "No data available", size = 120 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mb-4"
      >
        <rect x="20" y="40" width="80" height="60" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
        <rect x="30" y="50" width="60" height="40" rx="2" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1"/>
        <circle cx="45" cy="65" r="3" fill="#9ca3af"/>
        <circle cx="60" cy="65" r="3" fill="#9ca3af"/>
        <circle cx="75" cy="65" r="3" fill="#9ca3af"/>
      </svg>
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );
};

export default SimpleEmptyBox;