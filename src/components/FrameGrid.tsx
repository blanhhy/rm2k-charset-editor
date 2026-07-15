import React from 'react';
import { FramePosition, CHARSET_CONFIG } from '../types';
import { FrameCell } from './FrameCell';

interface FrameGridProps {
  imageIndex: number;
  charIndex: number;
}

export const FrameGrid: React.FC<FrameGridProps> = ({ imageIndex, charIndex }) => {
  const frames: FramePosition[] = [];
  
  for (let animRow = 0; animRow < CHARSET_CONFIG.ANIM_ROWS; animRow++) {
    for (let animCol = 0; animCol < CHARSET_CONFIG.ANIM_COLS; animCol++) {
      frames.push({
        imageIndex,
        charIndex,
        animIndex: animRow * CHARSET_CONFIG.ANIM_COLS + animCol,
      });
    }
  }
  
  return (
    <div className="grid grid-cols-3 gap-0.5 bg-gray-800 p-1 rounded">
      {frames.map((pos) => (
        <FrameCell
          key={`${pos.imageIndex}-${pos.charIndex}-${pos.animIndex}`}
          position={pos}
        />
      ))}
    </div>
  );
};