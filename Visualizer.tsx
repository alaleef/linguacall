import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Smooth out the volume
  const smoothedVolume = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Smooth transition
      const target = isActive ? volume : 0.05;
      smoothedVolume.current += (target - smoothedVolume.current) * 0.1;
      const currentVol = smoothedVolume.current;

      // Draw pulsing circles
      if (isActive || currentVol > 0.01) {
        // Outer Glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 100);
        gradient.addColorStop(0, `rgba(59, 130, 246, ${0.2 + currentVol * 0.5})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50 + currentVol * 100, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#60A5FA';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20 + currentVol * 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Ripples
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + currentVol * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30 + currentVol * 60, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Idle state
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="w-64 h-64 md:w-96 md:h-96 mx-auto"
    />
  );
};