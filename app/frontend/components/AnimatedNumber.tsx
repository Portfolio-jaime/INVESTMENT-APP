import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 2000, 
  prefix = '', 
  suffix = '', 
  decimals = 0 
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const increment = value / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCurrent(value);
        clearInterval(timer);
      } else {
        setCurrent(current);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {prefix}{current.toFixed(decimals)}{suffix}
    </span>
  );
};

export default AnimatedNumber;