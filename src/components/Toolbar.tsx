import React from 'react';
import { Plus, Scissors, Copy, Clipboard, Trash2, Undo, Redo } from 'lucide-react';
import { useCharsetStore } from '../hooks/useCharsetStore';

interface ToolbarProps {
  onImportClick: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onImportClick }) => {
  const {
    selectedFrame,
    clipboard,
    history,
    historyIndex,
    cutFrame,
    copyFrame,
    pasteFrame,
    deleteFrame,
    undo,
    redo,
  } = useCharsetStore();
  
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;
  const canPaste = clipboard !== null && clipboard.frames.length > 0;
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors btn-glow"
        >
          <Plus size={18} />
          <span className="font-medium">添加素材</span>
        </button>
        
        <div className="w-px h-8 bg-gray-600 mx-2" />
        
        <button
          onClick={() => selectedFrame && cutFrame(selectedFrame)}
          disabled={!selectedFrame}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="剪切 (Ctrl+X)"
        >
          <Scissors size={16} />
          <span className="text-sm">剪切</span>
        </button>
        
        <button
          onClick={() => selectedFrame && copyFrame(selectedFrame)}
          disabled={!selectedFrame}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="复制 (Ctrl+C)"
        >
          <Copy size={16} />
          <span className="text-sm">复制</span>
        </button>
        
        <button
          onClick={() => selectedFrame && pasteFrame(selectedFrame)}
          disabled={!selectedFrame || !canPaste}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="粘贴 (Ctrl+V)"
        >
          <Clipboard size={16} />
          <span className="text-sm">粘贴</span>
        </button>
        
        <button
          onClick={() => selectedFrame && deleteFrame(selectedFrame)}
          disabled={!selectedFrame}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="删除 (Delete)"
        >
          <Trash2 size={16} />
          <span className="text-sm">删除</span>
        </button>
        
        <div className="w-px h-8 bg-gray-600 mx-2" />
        
        <button
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="撤销 (Ctrl+Z)"
        >
          <Undo size={16} />
          <span className="text-sm">撤销</span>
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="重做 (Ctrl+Y)"
        >
          <Redo size={16} />
          <span className="text-sm">重做</span>
        </button>
        
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>快捷键: Ctrl+X/C/V/Z/Y</span>
          {selectedFrame && (
            <span className="text-cyan-400">
              选中: 图#{selectedFrame.imageIndex + 1} 角色#{selectedFrame.charIndex + 1} 帧#{selectedFrame.animIndex + 1}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};