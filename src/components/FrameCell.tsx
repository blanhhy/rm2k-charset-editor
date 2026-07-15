import React, { useRef, useEffect, useState } from 'react';
import { FramePosition, CHARSET_CONFIG } from '../types';
import { useCharsetStore } from '../hooks/useCharsetStore';

interface FrameCellProps {
  position: FramePosition;
}

export const FrameCell: React.FC<FrameCellProps> = ({ position }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { imageIndex, charIndex, animIndex } = position;
  
  const pixelData = useCharsetStore((state) => {
    const image = state.images[imageIndex];
    if (!image) return null;
    
    const charFrames = image.frames[charIndex];
    if (!charFrames) return null;
    
    const rowIdx = Math.floor(animIndex / CHARSET_CONFIG.ANIM_COLS);
    const colIdx = animIndex % CHARSET_CONFIG.ANIM_COLS;
    
    const rowFrames = charFrames[rowIdx];
    if (!rowFrames) return null;
    
    const frame = rowFrames[colIdx];
    if (!frame) return null;
    
    return frame.pixelData;
  });
  
  const version = useCharsetStore((state) => state.version);
  
  const isSelected = useCharsetStore((state) => {
    return state.selectedFrame?.imageIndex === imageIndex &&
      state.selectedFrame?.charIndex === charIndex &&
      state.selectedFrame?.animIndex === animIndex;
  });
  
  useEffect(() => {
    if (!pixelData) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = pixelData.width;
    canvas.height = pixelData.height;
    
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(pixelData.width, pixelData.height);
    imgData.data.set(pixelData.data);
    ctx.putImageData(imgData, 0, 0);
  }, [pixelData, version]);
  
  const handleClick = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) {
      e.stopPropagation();
      useCharsetStore.getState().selectFrame(position);
    }
    isDraggingRef.current = false;
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData('text/plain', JSON.stringify(position));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setIsDragOver(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragOver(false);
      }
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    
    try {
      const sourcePos = JSON.parse(data) as FramePosition;
      
      if (sourcePos && (sourcePos.imageIndex !== imageIndex ||
        sourcePos.charIndex !== charIndex ||
        sourcePos.animIndex !== animIndex)) {
        useCharsetStore.getState().swapFrames(sourcePos, position);
      }
    } catch (err) {
      console.error('Failed to parse drag data:', err);
    }
    
    isDraggingRef.current = false;
    setIsDragOver(false);
  };
  
  return (
    <div
      ref={containerRef}
      className={`frame-cell relative cursor-grab active:cursor-grabbing bg-gray-900 border overflow-hidden ${
        isSelected ? 'selected' : ''
      } ${isDragOver ? 'drag-over' : ''}`}
      style={{
        aspectRatio: '24/32',
        imageRendering: 'pixelated',
        borderColor: isDragOver ? '#06b6d4' : '#374151',
        borderWidth: isDragOver ? '2px' : '1px',
      }}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
      {isDragOver && (
        <div className="absolute inset-0 bg-cyan-500/20 pointer-events-none" />
      )}
    </div>
  );
};
