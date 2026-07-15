import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Pencil } from 'lucide-react';
import { CharsetImage, CHARSET_CONFIG } from '../types';
import { FrameGrid } from './FrameGrid';
import { useCharsetStore } from '../hooks/useCharsetStore';

interface CharsetCardProps {
  image: CharsetImage;
  index: number;
}

export const CharsetCard: React.FC<CharsetCardProps> = ({ image, index }) => {
  const { removeImage, exportImage, renameImage } = useCharsetStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(image.name);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleRemove = () => {
    if (confirm(`确定要删除 "${image.name}" 吗？`)) {
      removeImage(index);
    }
  };
  
  const handleExport = () => {
    const dataUrl = exportImage(index);
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${image.name}.png`;
      link.click();
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (editName.trim()) {
                  renameImage(index, editName.trim());
                } else {
                  setEditName(image.name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
                  if (editName.trim()) {
                    renameImage(index, editName.trim());
                  } else {
                    setEditName(image.name);
                  }
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditName(image.name);
                }
              }}
              className="bg-gray-700 border border-cyan-500 rounded px-2 py-1 text-white font-semibold outline-none"
            />
          ) : (
            <>
              <h3 className="text-white font-semibold">{image.name}</h3>
              <button
                onClick={() => {
                  setEditName(image.name);
                  setIsEditing(true);
                }}
                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                title="重命名"
              >
                <Pencil size={14} />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded transition-colors"
            title="导出图片"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleRemove}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            title="删除图片"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: CHARSET_CONFIG.COLS * CHARSET_CONFIG.ROWS }, (_, i) => (
          <FrameGrid key={i} imageIndex={index} charIndex={i} />
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>背景色: {image.backgroundColor}</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: image.backgroundColor }} />
          </span>
        </div>
      </div>
    </div>
  );
};