import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import emptyBoxAnimation from '../../assets/Empty box.json';

const LottieEmptyBox = ({ 
  message = "No data available", 
  size = 120, 
  className = "",
  loop = true,
  autoplay = true 
}) => {
  const animationContainer = useRef(null);
  const animationInstance = useRef(null);

  useEffect(() => {
    if (animationContainer.current) {
      // Destroy previous animation if it exists
      if (animationInstance.current) {
        animationInstance.current.destroy();
      }

      // Create new animation
      animationInstance.current = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: 'svg',
        loop: loop,
        autoplay: autoplay,
        animationData: emptyBoxAnimation,
      });
    }

    // Cleanup function
    return () => {
      if (animationInstance.current) {
        animationInstance.current.destroy();
      }
    };
  }, [loop, autoplay]);

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

export default LottieEmptyBox;