import { useEffect, useRef } from 'react';
 import emptyBoxAnimation from '../../assets/EmptyBox.json';

// Fallback SVG for when Lottie fails
const FallbackEmptyBox = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="80" height="60" rx="4" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2"/>
    <rect x="30" y="50" width="60" height="40" rx="2" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1"/>
    <circle cx="45" cy="65" r="3" fill="#9ca3af"/>
    <circle cx="60" cy="65" r="3" fill="#9ca3af"/>
    <circle cx="75" cy="65" r="3" fill="#9ca3af"/>
  </svg>
);

const EmptyBox = ({ 
  message = "No data available", 
  size = 120, 
  className = "" 
}) => {
  const animationContainer = useRef(null);

  useEffect(() => {
    let animationInstance = null;
    let mounted = true;

    const loadLottie = async () => {
      try {
        const lottie = await import('lottie-web');
        
        if (animationContainer.current && mounted) {
          animationInstance = lottie.default.loadAnimation({
            container: animationContainer.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: emptyBoxAnimation
          });
        }
      } catch (error) {
        console.log('Lottie failed to load:', error);
        // Show fallback instead
        if (animationContainer.current && mounted) {
          animationContainer.current.innerHTML = '';
          const fallback = document.createElement('div');
          fallback.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="40" width="80" height="60" rx="4" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
            <rect x="30" y="50" width="60" height="40" rx="2" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>
            <circle cx="45" cy="65" r="3" fill="#9ca3af"/>
            <circle cx="60" cy="65" r="3" fill="#9ca3af"/>
            <circle cx="75" cy="65" r="3" fill="#9ca3af"/>
          </svg>`;
          animationContainer.current.appendChild(fallback);
        }
      }
    };

    loadLottie();

    return () => {
      mounted = false;
      if (animationInstance) {
        animationInstance.destroy();
      }
    };
  }, [size]);

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div 
        ref={animationContainer}
        style={{ width: size, height: size }}
        className="mb-4"
      />
      <p className="text-gray-500 text-center">{message}</p>
    </div>
  );
};

export default EmptyBox;