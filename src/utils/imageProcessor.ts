import { Frame, CharsetImage, CHARSET_CONFIG } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function parseColor(colorString: string): { r: number; g: number; b: number } {
  if (colorString.startsWith('#')) {
    const hex = colorString.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

export function colorsMatch(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, tolerance: number = 0): boolean {
  return (
    Math.abs(c1.r - c2.r) <= tolerance &&
    Math.abs(c1.g - c2.g) <= tolerance &&
    Math.abs(c1.b - c2.b) <= tolerance
  );
}

export function createEmptyFrame(width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return ctx.createImageData(width, height);
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function processCharsetImage(
  img: HTMLImageElement,
  backgroundColor: string,
  imageIndex: number
): Promise<CharsetImage> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  const fullImageData = ctx.getImageData(0, 0, img.width, img.height);
  const bgColor = parseColor(backgroundColor);
  
  for (let i = 0; i < fullImageData.data.length; i += 4) {
    const pixelColor = {
      r: fullImageData.data[i],
      g: fullImageData.data[i + 1],
      b: fullImageData.data[i + 2],
    };
    if (colorsMatch(pixelColor, bgColor, 2)) {
      fullImageData.data[i + 3] = 0;
    }
  }
  
  ctx.putImageData(fullImageData, 0, 0);
  
  const frames: Frame[][][] = [];
  
  for (let charRow = 0; charRow < CHARSET_CONFIG.ROWS; charRow++) {
    for (let charCol = 0; charCol < CHARSET_CONFIG.COLS; charCol++) {
      const charIndex = charRow * CHARSET_CONFIG.COLS + charCol;
      const charFrames: Frame[][] = [];
      
      for (let animRow = 0; animRow < CHARSET_CONFIG.ANIM_ROWS; animRow++) {
        const rowFrames: Frame[] = [];
        for (let animCol = 0; animCol < CHARSET_CONFIG.ANIM_COLS; animCol++) {
          const animIndex = animRow * CHARSET_CONFIG.ANIM_COLS + animCol;
          
          const startX = charCol * CHARSET_CONFIG.CHAR_WIDTH + animCol * CHARSET_CONFIG.FRAME_WIDTH;
          const startY = charRow * CHARSET_CONFIG.CHAR_HEIGHT + animRow * CHARSET_CONFIG.FRAME_HEIGHT;
          
          const frameCanvas = document.createElement('canvas');
          frameCanvas.width = CHARSET_CONFIG.FRAME_WIDTH;
          frameCanvas.height = CHARSET_CONFIG.FRAME_HEIGHT;
          const frameCtx = frameCanvas.getContext('2d')!;
          frameCtx.drawImage(
            canvas,
            startX,
            startY,
            CHARSET_CONFIG.FRAME_WIDTH,
            CHARSET_CONFIG.FRAME_HEIGHT,
            0,
            0,
            CHARSET_CONFIG.FRAME_WIDTH,
            CHARSET_CONFIG.FRAME_HEIGHT
          );
          
          rowFrames.push({
            id: generateId(),
            imageIndex,
            charIndex,
            animIndex,
            pixelData: frameCtx.getImageData(0, 0, CHARSET_CONFIG.FRAME_WIDTH, CHARSET_CONFIG.FRAME_HEIGHT),
          });
        }
        charFrames.push(rowFrames);
      }
      frames.push(charFrames);
    }
  }
  
  return {
    id: generateId(),
    name: 'Charset',
    originalUrl: '',
    backgroundColor,
    frames,
  };
}

export function frameToCanvas(frame: Frame): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CHARSET_CONFIG.FRAME_WIDTH;
  canvas.height = CHARSET_CONFIG.FRAME_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(frame.pixelData, 0, 0);
  return canvas;
}

export function frameToDataUrl(frame: Frame): string {
  const canvas = frameToCanvas(frame);
  return canvas.toDataURL('image/png');
}

export function charsetToCanvas(charset: CharsetImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CHARSET_CONFIG.WIDTH;
  canvas.height = CHARSET_CONFIG.HEIGHT;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = charset.backgroundColor;
  ctx.fillRect(0, 0, CHARSET_CONFIG.WIDTH, CHARSET_CONFIG.HEIGHT);
  
  for (let charIndex = 0; charIndex < charset.frames.length; charIndex++) {
    const charFrames = charset.frames[charIndex];
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
  
  return canvas;
}

export function charsetToDataUrl(charset: CharsetImage): string {
  const canvas = charsetToCanvas(charset);
  return canvas.toDataURL('image/png');
}

export function copyFrameData(source: ImageData): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  const newImageData = ctx.createImageData(source.width, source.height);
  newImageData.data.set(source.data);
  return newImageData;
}