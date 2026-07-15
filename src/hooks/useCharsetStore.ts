import { create } from 'zustand';
import { CharsetImage, Clipboard, HistoryEntry, FramePosition } from '../types';
import { createEmptyFrame } from '../utils/imageProcessor';
import { CHARSET_CONFIG } from '../types';
import { encodePng8 } from '../utils/png8Encoder';

interface CharsetStore {
  images: CharsetImage[];
  clipboard: Clipboard | null;
  history: HistoryEntry[];
  historyIndex: number;
  selectedFrame: FramePosition | null;
  draggingFrame: FramePosition | null;
  version: number;
  
  addImage: (image: CharsetImage) => void;
  removeImage: (index: number) => void;
  renameImage: (index: number, name: string) => void;
  
  getFrame: (position: FramePosition) => ImageData | null;
  setFrame: (position: FramePosition, pixelData: ImageData) => void;
  
  swapFrames: (pos1: FramePosition, pos2: FramePosition) => void;
  
  cutFrame: (position: FramePosition) => void;
  copyFrame: (position: FramePosition) => void;
  pasteFrame: (position: FramePosition) => void;
  deleteFrame: (position: FramePosition) => void;
  
  undo: () => void;
  redo: () => void;
  
  selectFrame: (position: FramePosition | null) => void;
  setDraggingFrame: (position: FramePosition | null) => void;
  
  exportImage: (index: number) => string;
}

function clonePixelData(source: ImageData): ImageData {
  const newData = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  return newData;
}

function deepCloneImages(images: CharsetImage[]): CharsetImage[] {
  return images.map(img => {
    const newFrames: typeof img.frames = [];
    for (let charIdx = 0; charIdx < img.frames.length; charIdx++) {
      const charFrames = img.frames[charIdx];
      const newCharFrames: typeof charFrames = [];
      for (let rowIdx = 0; rowIdx < charFrames.length; rowIdx++) {
        const rowFrames = charFrames[rowIdx];
        const newRowFrames = rowFrames.map(frame => ({
          ...frame,
          pixelData: clonePixelData(frame.pixelData),
        }));
        newCharFrames.push(newRowFrames);
      }
      newFrames.push(newCharFrames);
    }
    return {
      ...img,
      frames: newFrames,
    };
  });
}

export const useCharsetStore = create<CharsetStore>((set, get) => ({
  images: [],
  clipboard: null,
  history: [],
  historyIndex: -1,
  selectedFrame: null,
  draggingFrame: null,
  version: 0,
  
  addImage: (image) => {
    set((state) => {
      const clonedImage = {
        ...image,
        frames: image.frames.map(charFrames =>
          charFrames.map(rowFrames =>
            rowFrames.map(frame => ({
              ...frame,
              pixelData: clonePixelData(frame.pixelData),
            }))
          )
        ),
      };
      return {
        images: [...state.images, clonedImage],
        history: [],
        historyIndex: -1,
        version: state.version + 1,
      };
    });
  },
  
  removeImage: (index) => {
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
      history: [],
      historyIndex: -1,
      version: state.version + 1,
    }));
  },
  
  renameImage: (index, name) => {
    set((state) => {
      const newImages = [...state.images];
      newImages[index] = {
        ...newImages[index],
        name,
      };
      return {
        images: newImages,
        version: state.version + 1,
      };
    });
  },
  
  getFrame: (position) => {
    const { images } = get();
    const image = images[position.imageIndex];
    if (!image) return null;
    const charFrames = image.frames[position.charIndex];
    if (!charFrames) return null;
    const animRow = Math.floor(position.animIndex / CHARSET_CONFIG.ANIM_COLS);
    const animCol = position.animIndex % CHARSET_CONFIG.ANIM_COLS;
    const rowFrames = charFrames[animRow];
    if (!rowFrames) return null;
    const frame = rowFrames[animCol];
    return frame ? frame.pixelData : null;
  },
  
  setFrame: (position, pixelData) => {
    set((state) => {
      const newPixelData = clonePixelData(pixelData);
      const newImages = deepCloneImages(state.images);
      
      const animRow = Math.floor(position.animIndex / CHARSET_CONFIG.ANIM_COLS);
      const animCol = position.animIndex % CHARSET_CONFIG.ANIM_COLS;
      
      const image = newImages[position.imageIndex];
      if (image) {
        const charFrames = image.frames[position.charIndex];
        if (charFrames) {
          const rowFrames = charFrames[animRow];
          if (rowFrames) {
            const frame = rowFrames[animCol];
            if (frame) {
              frame.pixelData = newPixelData;
            }
          }
        }
      }
      
      const beforeFrame = state.images[position.imageIndex]?.frames[position.charIndex]?.[animRow]?.[animCol];
      const beforeData = beforeFrame ? clonePixelData(beforeFrame.pixelData) : createEmptyFrame(CHARSET_CONFIG.FRAME_WIDTH, CHARSET_CONFIG.FRAME_HEIGHT);
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        operation: 'paste',
        before: [{ ...position, pixelData: beforeData }],
        after: [{ ...position, pixelData: clonePixelData(newPixelData) }],
      });
      
      return {
        images: newImages,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        version: state.version + 1,
      };
    });
  },
  
  swapFrames: (pos1, pos2) => {
    set((state) => {
      const img1 = state.images[pos1.imageIndex];
      const img2 = state.images[pos2.imageIndex];
      
      if (!img1 || !img2) return state;
      
      const char1 = img1.frames[pos1.charIndex];
      const char2 = img2.frames[pos2.charIndex];
      
      if (!char1 || !char2) return state;
      
      const row1 = char1[Math.floor(pos1.animIndex / CHARSET_CONFIG.ANIM_COLS)];
      const row2 = char2[Math.floor(pos2.animIndex / CHARSET_CONFIG.ANIM_COLS)];
      
      if (!row1 || !row2) return state;
      
      const frame1 = row1[pos1.animIndex % CHARSET_CONFIG.ANIM_COLS];
      const frame2 = row2[pos2.animIndex % CHARSET_CONFIG.ANIM_COLS];
      
      if (!frame1 || !frame2) return state;
      
      const frame1Data = clonePixelData(frame1.pixelData);
      const frame2Data = clonePixelData(frame2.pixelData);
      
      const newImages = deepCloneImages(state.images);
      
      const newImg1 = newImages[pos1.imageIndex];
      const newImg2 = newImages[pos2.imageIndex];
      
      newImg1.frames[pos1.charIndex][Math.floor(pos1.animIndex / CHARSET_CONFIG.ANIM_COLS)][pos1.animIndex % CHARSET_CONFIG.ANIM_COLS].pixelData = frame2Data;
      newImg2.frames[pos2.charIndex][Math.floor(pos2.animIndex / CHARSET_CONFIG.ANIM_COLS)][pos2.animIndex % CHARSET_CONFIG.ANIM_COLS].pixelData = frame1Data;
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        operation: 'swap',
        before: [
          { ...pos1, pixelData: clonePixelData(frame1Data) },
          { ...pos2, pixelData: clonePixelData(frame2Data) },
        ],
        after: [
          { ...pos1, pixelData: clonePixelData(frame2Data) },
          { ...pos2, pixelData: clonePixelData(frame1Data) },
        ],
      });
      
      return {
        images: newImages,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        version: state.version + 1,
      };
    });
  },
  
  cutFrame: (position) => {
    set((state) => {
      const img = state.images[position.imageIndex];
      if (!img) return state;
      
      const charFrames = img.frames[position.charIndex];
      if (!charFrames) return state;
      
      const animRow = Math.floor(position.animIndex / CHARSET_CONFIG.ANIM_COLS);
      const animCol = position.animIndex % CHARSET_CONFIG.ANIM_COLS;
      const rowFrames = charFrames[animRow];
      if (!rowFrames) return state;
      
      const frame = rowFrames[animCol];
      if (!frame) return state;
      
      const frameData = clonePixelData(frame.pixelData);
      const emptyFrame = createEmptyFrame(CHARSET_CONFIG.FRAME_WIDTH, CHARSET_CONFIG.FRAME_HEIGHT);
      
      const newImages = deepCloneImages(state.images);
      newImages[position.imageIndex].frames[position.charIndex][animRow][animCol].pixelData = clonePixelData(emptyFrame);
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        operation: 'cut',
        before: [{ ...position, pixelData: clonePixelData(frameData) }],
        after: [{ ...position, pixelData: clonePixelData(emptyFrame) }],
      });
      
      return {
        images: newImages,
        clipboard: {
          frames: [{ id: 'clipboard-frame', ...position, pixelData: clonePixelData(frameData) }],
          operation: 'cut',
        },
        history: newHistory,
        historyIndex: newHistory.length - 1,
        version: state.version + 1,
      };
    });
  },
  
  copyFrame: (position) => {
    set((state) => {
      const img = state.images[position.imageIndex];
      if (!img) return state;
      
      const charFrames = img.frames[position.charIndex];
      if (!charFrames) return state;
      
      const animRow = Math.floor(position.animIndex / CHARSET_CONFIG.ANIM_COLS);
      const animCol = position.animIndex % CHARSET_CONFIG.ANIM_COLS;
      const rowFrames = charFrames[animRow];
      if (!rowFrames) return state;
      
      const frame = rowFrames[animCol];
      if (!frame) return state;
      
      const frameData = clonePixelData(frame.pixelData);
      
      return {
        clipboard: {
          frames: [{ id: 'clipboard-frame', ...position, pixelData: frameData }],
          operation: 'copy',
        },
      };
    });
  },
  
  pasteFrame: (position) => {
    set((state) => {
      if (!state.clipboard || state.clipboard.frames.length === 0) return state;
      
      const sourceFrame = state.clipboard.frames[0];
      if (!sourceFrame.pixelData) return state;
      
      const sourcePixelData = clonePixelData(sourceFrame.pixelData);
      
      const img = state.images[position.imageIndex];
      if (!img) return state;
      
      const charFrames = img.frames[position.charIndex];
      if (!charFrames) return state;
      
      const animRow = Math.floor(position.animIndex / CHARSET_CONFIG.ANIM_COLS);
      const animCol = position.animIndex % CHARSET_CONFIG.ANIM_COLS;
      const rowFrames = charFrames[animRow];
      if (!rowFrames) return state;
      
      const frame = rowFrames[animCol];
      if (!frame) return state;
      
      const beforeData = clonePixelData(frame.pixelData);
      
      const newImages = deepCloneImages(state.images);
      newImages[position.imageIndex].frames[position.charIndex][animRow][animCol].pixelData = sourcePixelData;
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        operation: 'paste',
        before: [{ ...position, pixelData: beforeData }],
        after: [{ ...position, pixelData: clonePixelData(sourcePixelData) }],
      });
      
      return {
        images: newImages,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        version: state.version + 1,
      };
    });
  },
  
  deleteFrame: (position) => {
    set((state) => {
      const img = state.images[position.imageIndex];
      if (!img) return state;
      
      const charFrames = img.frames[position.charIndex];
      if (!charFrames) return state;
      
      const animRow = Math.floor(position.animIndex / CHARSET_CONFIG.ANIM_COLS);
      const animCol = position.animIndex % CHARSET_CONFIG.ANIM_COLS;
      const rowFrames = charFrames[animRow];
      if (!rowFrames) return state;
      
      const frame = rowFrames[animCol];
      if (!frame) return state;
      
      const beforeData = clonePixelData(frame.pixelData);
      const emptyFrame = createEmptyFrame(CHARSET_CONFIG.FRAME_WIDTH, CHARSET_CONFIG.FRAME_HEIGHT);
      
      const newImages = deepCloneImages(state.images);
      newImages[position.imageIndex].frames[position.charIndex][animRow][animCol].pixelData = clonePixelData(emptyFrame);
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        operation: 'delete',
        before: [{ ...position, pixelData: beforeData }],
        after: [{ ...position, pixelData: clonePixelData(emptyFrame) }],
      });
      
      return {
        images: newImages,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        version: state.version + 1,
      };
    });
  },
  
  undo: () => {
    set((state) => {
      if (state.historyIndex < 0) return state;
      
      const entry = state.history[state.historyIndex];
      const newImages = deepCloneImages(state.images);
      
      entry.before.forEach(beforeEntry => {
        const animRow = Math.floor(beforeEntry.animIndex / CHARSET_CONFIG.ANIM_COLS);
        const animCol = beforeEntry.animIndex % CHARSET_CONFIG.ANIM_COLS;
        const img = newImages[beforeEntry.imageIndex];
        if (img) {
          const charFrames = img.frames[beforeEntry.charIndex];
          if (charFrames) {
            const rowFrames = charFrames[animRow];
            if (rowFrames) {
              rowFrames[animCol].pixelData = clonePixelData(beforeEntry.pixelData);
            }
          }
        }
      });
      
      return {
        images: newImages,
        historyIndex: state.historyIndex - 1,
        version: state.version + 1,
      };
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      
      const entry = state.history[state.historyIndex + 1];
      const newImages = deepCloneImages(state.images);
      
      entry.after.forEach(afterEntry => {
        const animRow = Math.floor(afterEntry.animIndex / CHARSET_CONFIG.ANIM_COLS);
        const animCol = afterEntry.animIndex % CHARSET_CONFIG.ANIM_COLS;
        const img = newImages[afterEntry.imageIndex];
        if (img) {
          const charFrames = img.frames[afterEntry.charIndex];
          if (charFrames) {
            const rowFrames = charFrames[animRow];
            if (rowFrames) {
              rowFrames[animCol].pixelData = clonePixelData(afterEntry.pixelData);
            }
          }
        }
      });
      
      return {
        images: newImages,
        historyIndex: state.historyIndex + 1,
        version: state.version + 1,
      };
    });
  },
  
  selectFrame: (position) => {
    set({ selectedFrame: position });
  },
  
  setDraggingFrame: (position) => {
    set({ draggingFrame: position });
  },
  
  exportImage: (index) => {
    const { images } = get();
    const image = images[index];
    if (!image) return '';
    
    const canvas = document.createElement('canvas');
    canvas.width = CHARSET_CONFIG.WIDTH;
    canvas.height = CHARSET_CONFIG.HEIGHT;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = image.backgroundColor;
    ctx.fillRect(0, 0, CHARSET_CONFIG.WIDTH, CHARSET_CONFIG.HEIGHT);
    
    for (let charIndex = 0; charIndex < image.frames.length; charIndex++) {
      const charFrames = image.frames[charIndex];
      const charCol = charIndex % CHARSET_CONFIG.COLS;
      const charRow = Math.floor(charIndex / CHARSET_CONFIG.COLS);
      
      for (let animRow = 0; animRow < CHARSET_CONFIG.ANIM_ROWS; animRow++) {
        for (let animCol = 0; animCol < CHARSET_CONFIG.ANIM_COLS; animCol++) {
          const frame = charFrames[animRow][animCol];
          const startX = charCol * CHARSET_CONFIG.CHAR_WIDTH + animCol * CHARSET_CONFIG.FRAME_WIDTH;
          const startY = charRow * CHARSET_CONFIG.CHAR_HEIGHT + animRow * CHARSET_CONFIG.FRAME_HEIGHT;
          
          ctx.putImageData(frame.pixelData, startX, startY);
        }
      }
    }
    
    const pixelData = ctx.getImageData(0, 0, CHARSET_CONFIG.WIDTH, CHARSET_CONFIG.HEIGHT);
    return encodePng8(CHARSET_CONFIG.WIDTH, CHARSET_CONFIG.HEIGHT, pixelData.data, image.backgroundColor);
  },
}));

if (import.meta.env.DEV) {
  (window as any).__CHARSET_STORE__ = useCharsetStore;
}