import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Plus, Upload } from 'lucide-react';
import { processCharsetImage, parseColor } from '../utils/imageProcessor';
import { useCharsetStore } from '../hooks/useCharsetStore';
import { CHARSET_CONFIG } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  droppedFile?: File | null;
}

type ImportMode = 'new' | 'import';

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, droppedFile }) => {
  const [mode, setMode] = useState<ImportMode>('new');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [isSelectingColor, setIsSelectingColor] = useState(false);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addImage, images } = useCharsetStore();
  
  useEffect(() => {
    if (!isOpen) {
      setMode('new');
      setImage(null);
      setBackgroundColor('#000000');
      setIsSelectingColor(false);
      setPreviewCanvas(null);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (droppedFile && isOpen) {
      setMode('import');
      const url = URL.createObjectURL(droppedFile);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const pixelData = ctx.getImageData(0, 0, 1, 1).data;
        const hex = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`;
        setBackgroundColor(hex);
      };
      img.src = url;
    }
  }, [droppedFile, isOpen]);
  
  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
    }
  }, [image]);
  
  useEffect(() => {
    if (image) {
      updatePreview(backgroundColor);
    }
  }, [image, backgroundColor]);
  
  useEffect(() => {
    if (image && !isSelectingColor) {
      setIsSelectingColor(true);
    }
  }, [image, isSelectingColor]);
  
  const updatePreview = (bgColor: string) => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    
    const fullImageData = ctx.getImageData(0, 0, image.width, image.height);
    const parsedBgColor = parseColor(bgColor);
    
    for (let i = 0; i < fullImageData.data.length; i += 4) {
      const pixelColor = {
        r: fullImageData.data[i],
        g: fullImageData.data[i + 1],
        b: fullImageData.data[i + 2],
      };
      
      const tolerance = 2;
      if (
        Math.abs(pixelColor.r - parsedBgColor.r) <= tolerance &&
        Math.abs(pixelColor.g - parsedBgColor.g) <= tolerance &&
        Math.abs(pixelColor.b - parsedBgColor.b) <= tolerance
      ) {
        fullImageData.data[i + 3] = 0;
      }
    }
    
    ctx.putImageData(fullImageData, 0, 0);
    setPreviewCanvas(canvas);
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const pixelData = ctx.getImageData(0, 0, 1, 1).data;
      const hex = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`;
      setBackgroundColor(hex);
    };
    img.src = url;
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingColor || !canvasRef.current || !image) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (image.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (image.height / rect.height));
    
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const pixelData = ctx.getImageData(x, y, 1, 1).data;
    
    const hex = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`;
    setBackgroundColor(hex);
  };
  
  const handleCreateEmpty = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CHARSET_CONFIG.WIDTH;
    canvas.height = CHARSET_CONFIG.HEIGHT;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, CHARSET_CONFIG.WIDTH, CHARSET_CONFIG.HEIGHT);
    
    const img = new Image();
    img.onload = async () => {
      const charset = await processCharsetImage(img, backgroundColor, images.length);
      charset.name = 'Charset ' + (images.length + 1);
      addImage(charset);
      onClose();
    };
    img.src = canvas.toDataURL('image/png');
  };
  
  const handleImport = async () => {
    if (!image) return;
    
    const charset = await processCharsetImage(image, backgroundColor, images.length);
    charset.name = 'Charset ' + (images.length + 1);
    addImage(charset);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">添加 Charset 素材</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg">
          <button
            onClick={() => setMode('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'new'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Plus size={16} />
            新建空素材
          </button>
          <button
            onClick={() => setMode('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'import'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Upload size={16} />
            导入素材
          </button>
        </div>
        
        {mode === 'new' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">选择背景色</label>
              <div className="flex items-center gap-4">
                <span
                  className="w-12 h-12 rounded-lg border-2 border-gray-600"
                  style={{ backgroundColor: backgroundColor }}
                />
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                此背景色将在导出图片时使用，编辑时透明区域将显示为灰色棋盘格
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateEmpty}
                className="flex-1 py-3 px-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={18} />
                创建空素材
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">选择图片文件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleFileChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
              />
            </div>
            
            {image && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-sm">
                    点击图片选择背景色（将被视为透明）
                  </label>
                  <button
                    onClick={() => setIsSelectingColor(!isSelectingColor)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      isSelectingColor
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {isSelectingColor ? '取消取色' : '取色模式'}
                  </button>
                </div>
                
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ maxWidth: '100%' }}>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className={`max-w-full ${isSelectingColor ? 'cursor-crosshair' : 'cursor-default'}`}
                    style={{
                      maxWidth: '100%',
                      imageRendering: 'pixelated',
                    }}
                  />
                  {isSelectingColor && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500 rounded-lg" />
                  )}
                </div>
                
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">当前背景色:</span>
                    <span
                      className="w-8 h-8 rounded border border-gray-600"
                      style={{ backgroundColor: backgroundColor }}
                    />
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-cyan-400 font-mono text-sm">{backgroundColor}</span>
                  </div>
                </div>
              </div>
            )}
            
            {previewCanvas && (
              <div>
                <label className="block text-gray-400 text-sm mb-2">透明效果预览</label>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ maxWidth: '100%' }}>
                  <div className="absolute inset-0 bg-gray-700" style={{
                    backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  }} />
                  <img
                    src={previewCanvas.toDataURL('image/png')}
                    alt="Preview"
                    className="relative max-w-full"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={!image}
                className="flex-1 py-3 px-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={18} />
                确认导入
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">格式说明</h3>
          <ul className="text-gray-500 text-xs space-y-1">
            <li>- 图片尺寸: {CHARSET_CONFIG.WIDTH} × {CHARSET_CONFIG.HEIGHT} 像素</li>
            <li>- 网格划分: {CHARSET_CONFIG.COLS} × {CHARSET_CONFIG.ROWS} 角色区域</li>
            <li>- 每个区域: {CHARSET_CONFIG.ANIM_COLS} × {CHARSET_CONFIG.ANIM_ROWS} 动画帧</li>
            <li>- 单帧尺寸: {CHARSET_CONFIG.FRAME_WIDTH} × {CHARSET_CONFIG.FRAME_HEIGHT} 像素</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
