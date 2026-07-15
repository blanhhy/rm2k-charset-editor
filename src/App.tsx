import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { CharsetCard } from './components/CharsetCard';
import { ImportModal } from './components/ImportModal';
import { useCharsetStore } from './hooks/useCharsetStore';

function App() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const images = useCharsetStore((state) => state.images);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'x':
            e.preventDefault();
            const state1 = useCharsetStore.getState();
            if (state1.selectedFrame) state1.cutFrame(state1.selectedFrame);
            break;
          case 'c':
            e.preventDefault();
            const state2 = useCharsetStore.getState();
            if (state2.selectedFrame) state2.copyFrame(state2.selectedFrame);
            break;
          case 'v':
            e.preventDefault();
            const state3 = useCharsetStore.getState();
            if (state3.selectedFrame) state3.pasteFrame(state3.selectedFrame);
            break;
          case 'z':
            e.preventDefault();
            const state4 = useCharsetStore.getState();
            if (e.shiftKey) {
              state4.redo();
            } else {
              state4.undo();
            }
            break;
          case 'y':
            e.preventDefault();
            useCharsetStore.getState().redo();
            break;
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        const state5 = useCharsetStore.getState();
        if (state5.selectedFrame) state5.deleteFrame(state5.selectedFrame);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'image/png') {
      setDroppedFile(file);
      setIsImportModalOpen(true);
    }
    
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (!isImportModalOpen) {
      setDroppedFile(null);
    }
  }, [isImportModalOpen]);
  
  return (
    <div 
      className={`min-h-screen bg-gray-900 flex flex-col transition-colors ${
        isDragging ? 'bg-gray-800' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">RM2K Charset Editor</h1>
            <p className="text-xs text-gray-500">可视化整理 RPG Maker 2000 Charset 素材</p>
          </div>
        </div>
      </header>
      
      <Toolbar onImportClick={() => setIsImportModalOpen(true)} />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
              <div className="w-24 h-24 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-400 mb-2">还没有导入任何素材</h2>
              <p className="text-sm mb-6">点击左上方加号按钮，或直接拖放 PNG 文件到此处</p>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
              >
                立即导入
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {images.map((image, index) => (
                <CharsetCard key={image.id} image={image} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        droppedFile={droppedFile}
      />
    </div>
  );
}

export default App;