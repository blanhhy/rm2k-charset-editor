interface RGB {
  r: number;
  g: number;
  b: number;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  const table: number[] = [];
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    typeBytes[i] = type.charCodeAt(i);
  }
  
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  
  const crcData = new Uint8Array(typeBytes.length + data.length);
  crcData.set(typeBytes, 0);
  crcData.set(data, 4);
  view.setUint32(8 + data.length, crc32(crcData));
  
  return chunk;
}

function adler32(data: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function deflate(data: Uint8Array): Uint8Array {
  const blocks: Uint8Array[] = [];
  const blockSize = 65535;
  
  for (let i = 0; i < data.length; i += blockSize) {
    const isLast = i + blockSize >= data.length;
    const blockData = data.slice(i, Math.min(i + blockSize, data.length));
    
    const header = new Uint8Array(5);
    header[0] = isLast ? 1 : 0;
    const len = blockData.length;
    header[1] = len & 0xFF;
    header[2] = (len >> 8) & 0xFF;
    header[3] = (~len) & 0xFF;
    header[4] = ((~len) >> 8) & 0xFF;
    
    const block = new Uint8Array(header.length + blockData.length);
    block.set(header, 0);
    block.set(blockData, 5);
    blocks.push(block);
  }
  
  const zlibHeader = new Uint8Array([0x78, 0x01]);
  
  const uncompressed = new Uint8Array(
    blocks.reduce((sum, b) => sum + b.length, 0)
  );
  let offset = 0;
  for (const block of blocks) {
    uncompressed.set(block, offset);
    offset += block.length;
  }
  
  const result = new Uint8Array(
    zlibHeader.length + uncompressed.length + 4
  );
  result.set(zlibHeader, 0);
  result.set(uncompressed, zlibHeader.length);
  
  const adler = adler32(data);
  const adlerView = new DataView(result.buffer);
  adlerView.setUint32(zlibHeader.length + uncompressed.length, adler);
  
  return result;
}

function parseHexColor(color: string): RGB {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

export function encodePng8(
  width: number,
  height: number,
  pixelData: Uint8ClampedArray,
  backgroundColor: string
): string {
  const bgColor = parseHexColor(backgroundColor);
  
  const palette: RGB[] = [];
  const colorMap = new Map<string, number>();
  
  palette.push(bgColor);
  colorMap.set(`${bgColor.r},${bgColor.g},${bgColor.b}`, 0);
  
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];
    const a = pixelData[i + 3];
    
    if (a === 0) {
      continue;
    }
    
    const key = `${r},${g},${b}`;
    if (!colorMap.has(key)) {
      if (palette.length < 256) {
        palette.push({ r, g, b });
        colorMap.set(key, palette.length - 1);
      }
    }
  }
  
  const indexedData = new Uint8Array(height * (width + 1));
  
  for (let y = 0; y < height; y++) {
    indexedData[y * (width + 1)] = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixelData[idx];
      const g = pixelData[idx + 1];
      const b = pixelData[idx + 2];
      const a = pixelData[idx + 3];
      
      if (a === 0) {
        indexedData[y * (width + 1) + 1 + x] = 0;
      } else {
        const key = `${r},${g},${b}`;
        const paletteIndex = colorMap.get(key) || 0;
        indexedData[y * (width + 1) + 1 + x] = paletteIndex;
      }
    }
  }
  
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData[8] = 8;
  ihdrData[9] = 3;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  
  const plteData = new Uint8Array(palette.length * 3);
  for (let i = 0; i < palette.length; i++) {
    plteData[i * 3] = palette[i].r;
    plteData[i * 3 + 1] = palette[i].g;
    plteData[i * 3 + 2] = palette[i].b;
  }
  
  const compressedData = deflate(indexedData);
  
  const signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const plteChunk = createChunk('PLTE', plteData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', new Uint8Array(0));
  
  const png = new Uint8Array(
    signature.length +
    ihdrChunk.length +
    plteChunk.length +
    idatChunk.length +
    iendChunk.length
  );
  
  let offset = 0;
  png.set(signature, offset);
  offset += signature.length;
  png.set(ihdrChunk, offset);
  offset += ihdrChunk.length;
  png.set(plteChunk, offset);
  offset += plteChunk.length;
  png.set(idatChunk, offset);
  offset += idatChunk.length;
  png.set(iendChunk, offset);
  
  const base64 = btoa(String.fromCharCode(...png));
  return `data:image/png;base64,${base64}`;
}
