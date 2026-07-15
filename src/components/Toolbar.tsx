import React, { useState, useRef, useEffect } from 'react';
import { Plus, Scissors, Copy, Clipboard, Trash2, Undo, Redo, FlipHorizontal, FlipVertical, PaintBucket, Square, Download, Upload, ChevronDown } from 'lucide-react';
import { useCharsetStore } from '../hooks/useCharsetStore';
import { DIRECTIONS, ANIM_STATES, CHARSET_CONFIG } from '../types';

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
    flipFrameHorizontal,
    flipFrameVertical,
    fillFrameColor,
    addFrameOutline,
    changeOutlineColor,
    removeFrameOutline,
    importFrame,
    exportFrame,
  } = useCharsetStore();
  
  const [showFrameMenu, setShowFrameMenu] = useState(false);
  const [fillColor, setFillColor] = useState('#000000');
  const [preserveOutline, setPreserveOutline] = useState(false);
  const [outlineColor, setOutlineColor] = useState('#ffffff');
  const [changeNewColor, setChangeNewColor] = useState('#ff0000');
  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;
  const canPaste = clipboard !== null && clipboard.frames.length > 0;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowFrameMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleExportFrame = () => {
    if (!selectedFrame) return;
    const result = exportFrame(selectedFrame);
    if (result) {
      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = result.fileName;
      link.click();
    }
    setShowFrameMenu(false);
  };
  
  const handleImportFrame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedFrame) {
      importFrame(selectedFrame, file);
    }
    e.target.value = '';
    setShowFrameMenu(false);
  };
  
  const handleAddOutline = () => {
    if (selectedFrame) {
      addFrameOutline(selectedFrame, outlineColor);
    }
    setShowFrameMenu(false);
  };
  
  const handleChangeOutlineColor = () => {
    if (selectedFrame) {
      changeOutlineColor(selectedFrame, changeNewColor);
    }
    setShowFrameMenu(false);
  };
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center gap-2">
        <button onClick={onImportClick} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors btn-glow">
          <Plus size={18} />
          <span className="font-medium">添加素材</span>
        </button>
        
        <div className="w-px h-8 bg-gray-600 mx-2" />
        
        <button onClick={() => selectedFrame && cutFrame(selectedFrame)} disabled={!selectedFrame} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="剪切 (Ctrl+X)">
          <Scissors size={16} />
          <span className="text-sm">剪切</span>
        </button>
        
        <button onClick={() => selectedFrame && copyFrame(selectedFrame)} disabled={!selectedFrame} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="复制 (Ctrl+C)">
          <Copy size={16} />
          <span className="text-sm">复制</span>
        </button>
        
        <button onClick={() => selectedFrame && pasteFrame(selectedFrame)} disabled={!selectedFrame || !canPaste} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="粘贴 (Ctrl+V)">
          <Clipboard size={16} />
          <span className="text-sm">粘贴</span>
        </button>
        
        <button onClick={() => selectedFrame && deleteFrame(selectedFrame)} disabled={!selectedFrame} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="删除 (Delete)">
          <Trash2 size={16} />
          <span className="text-sm">删除</span>
        </button>
        
        <div className="w-px h-8 bg-gray-600 mx-2" />
        
        <button onClick={undo} disabled={!canUndo} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="撤销 (Ctrl+Z)">
          <Undo size={16} />
          <span className="text-sm">撤销</span>
        </button>
        
        <button onClick={redo} disabled={!canRedo} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="重做 (Ctrl+Y)">
          <Redo size={16} />
          <span className="text-sm">重做</span>
        </button>
        
        <div className="w-px h-8 bg-gray-600 mx-2" />
        
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowFrameMenu(!showFrameMenu)} disabled={!selectedFrame} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <PaintBucket size={16} />
            <span className="text-sm">图帧操作</span>
            <ChevronDown size={14} />
          </button>
          
          {showFrameMenu && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-2">
                <div className="text-xs text-gray-400 px-2 py-1 mb-1">翻转</div>
                <button onClick={() => { selectedFrame && flipFrameHorizontal(selectedFrame); setShowFrameMenu(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 text-gray-300 text-sm">
                  <FlipHorizontal size={14} />
                  水平翻转
                </button>
                <button onClick={() => { selectedFrame && flipFrameVertical(selectedFrame); setShowFrameMenu(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 text-gray-300 text-sm">
                  <FlipVertical size={14} />
                  垂直翻转
                </button>
                
                <div className="text-xs text-gray-400 px-2 py-1 mt-2 mb-1">颜色填充</div>
                <div className="px-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-600" />
                    <button onClick={() => { selectedFrame && fillFrameColor(selectedFrame, fillColor, false); setShowFrameMenu(false); }} className="flex-1 px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                      填充颜色
                    </button>
                  </div>
                  <button onClick={() => { selectedFrame && fillFrameColor(selectedFrame, fillColor, true); setShowFrameMenu(false); }} className="w-full px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                    填充颜色(保留描边)
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 px-2 py-1 mt-2 mb-1">描边</div>
                <div className="px-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-600" />
                    <button onClick={handleAddOutline} className="flex-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs">
                      添加描边
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={changeNewColor} onChange={(e) => setChangeNewColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-gray-600" title="新颜色" />
                    <button onClick={handleChangeOutlineColor} className="flex-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs">
                      改描边色
                    </button>
                  </div>
                  <button onClick={() => { selectedFrame && removeFrameOutline(selectedFrame); setShowFrameMenu(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                    删除描边
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 px-2 py-1 mt-2 mb-1">导入/导出</div>
                <button onClick={() => importInputRef.current?.click()} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 text-gray-300 text-sm">
                  <Upload size={14} />
                  导入图帧
                </button>
                <button onClick={handleExportFrame} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700 text-gray-300 text-sm">
                  <Download size={14} />
                  导出图帧
                </button>
              </div>
            </div>
          )}
        </div>
        
        <input ref={importInputRef} type="file" accept="image/png,image/jpeg" onChange={handleImportFrame} className="hidden" />
        
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <span>快捷键: Ctrl+X/C/V/Z/Y</span>
          {selectedFrame && (
            <span className="text-cyan-400">
              选中: 图#{selectedFrame.imageIndex + 1} 角色#{selectedFrame.charIndex + 1} {DIRECTIONS[Math.floor(selectedFrame.animIndex / CHARSET_CONFIG.ANIM_COLS)]}{ANIM_STATES[selectedFrame.animIndex % CHARSET_CONFIG.ANIM_COLS]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
