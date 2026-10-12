const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per row
  const rowBytes = width * 4;
  const rawBuf = Buffer.alloc((1 + rowBytes) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.48 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowBytes);
    rawBuf[rowOffset] = 0; // filter: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded background
      // Gradient from indigo-600 (#4f46e5) to violet-700 (#4338ca)
      const t = (x + y) / (width + height);
      let r = Math.round(79 + (67 - 79) * t);
      let g = Math.round(70 + (56 - 70) * t);
      let b = Math.round(229 + (202 - 229) * t);
      let a = 255;

      if (!isMaskable) {
        // Squircle mask
        const cornerR = width * 0.22;
        const inCornerX = Math.abs(dx) > (cx - cornerR);
        const inCornerY = Math.abs(dy) > (cy - cornerR);
        if (inCornerX && inCornerY) {
          const cdx = Math.abs(dx) - (cx - cornerR);
          const cdy = Math.abs(dy) - (cy - cornerR);
          if (cdx * cdx + cdy * cdy > cornerR * cornerR) {
            a = 0;
          }
        }
      }

      // Draw ₹ symbol shape
      const rx = (x - cx) / (width * 0.28);
      const ry = (y - cy) / (height * 0.28);

      // Top bar: ry around -0.6
      const inTopBar = Math.abs(ry - (-0.6)) < 0.12 && Math.abs(rx) < 0.7;
      // Second bar: ry around -0.3
      const inMidBar = Math.abs(ry - (-0.3)) < 0.12 && Math.abs(rx) < 0.55;
      // Vertical stem
      const inStem = Math.abs(rx - (-0.4)) < 0.14 && ry > -0.6 && ry < 0.2;
      // Upper curve
      const inCurve = rx > -0.4 && rx < 0.4 && ry > -0.6 && ry < 0.05 && (Math.abs(Math.sqrt((rx + 0.1)**2 + (ry + 0.25)**2) - 0.35) < 0.12);
      // Diagonal leg
      const inLeg = (rx > -0.2 && rx < 0.6) && (ry > -0.05 && ry < 0.7) && Math.abs((ry - (rx * 1.15)) - 0.05) < 0.14;

      if (a > 0 && (inTopBar || inMidBar || inStem || inCurve || inLeg)) {
        r = 255;
        g = 255;
        b = 255;
      }

      rawBuf[pxOffset] = r;
      rawBuf[pxOffset + 1] = g;
      rawBuf[pxOffset + 2] = b;
      rawBuf[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawBuf);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const path = require('path');
const outDir = path.resolve(__dirname, 'public');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), generatePng(48, 48, false));

console.log('Successfully generated all PWA PNG icons in', outDir);

