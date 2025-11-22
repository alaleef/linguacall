import React, { useState, useEffect } from 'react';

interface CallTimerProps {
  isActive: boolean;
}

export const CallTimer: React.FC<CallTimerProps> = ({ isActive }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="font-mono text-xl tracking-widest opacity-90">
      {formatTime(seconds)}
    </div>
  );
};