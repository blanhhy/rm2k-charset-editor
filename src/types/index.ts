export interface Frame {
  id: string;
  imageIndex: number;
  charIndex: number;
  animIndex: number;
  pixelData: ImageData;
}

export interface CharsetImage {
  id: string;
  name: string;
  originalUrl: string;
  backgroundColor: string;
  frames: Frame[][][];
}

export interface Clipboard {
  frames: Frame[];
  operation: 'cut' | 'copy';
}

export interface HistoryEntry {
  operation: 'swap' | 'cut' | 'copy' | 'paste' | 'delete' | 'flipHorizontal' | 'flipVertical' | 'fillColor' | 'addOutline' | 'changeOutlineColor' | 'removeOutline' | 'importFrame';
  before: { imageIndex: number; charIndex: number; animIndex: number; pixelData: ImageData }[];
  after: { imageIndex: number; charIndex: number; animIndex: number; pixelData: ImageData }[];
}

export interface FramePosition {
  imageIndex: number;
  charIndex: number;
  animIndex: number;
}

export const CHARSET_CONFIG = {
  WIDTH: 288,
  HEIGHT: 256,
  COLS: 4,
  ROWS: 2,
  CHAR_WIDTH: 72,
  CHAR_HEIGHT: 128,
  ANIM_COLS: 3,
  ANIM_ROWS: 4,
  FRAME_WIDTH: 24,
  FRAME_HEIGHT: 32,
};

export const DIRECTIONS = ['上', '右', '下', '左'];
export const ANIM_STATES = ['左', '中', '右'];