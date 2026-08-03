// Generates warm sitter PWA icons (no external deps) — a sky-blue field with a
// warm sun. Full-bleed so the icons work as "maskable". Outputs to public/icons.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

// ---- CRC32 (for PNG chunks) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rows prefixed with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function draw(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const sunR = size * 0.26;
  const rayInner = size * 0.32;
  const rayOuter = size * 0.42;

  const set = (x, y, [r, g, b]) => {
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  };

  const SKY_TOP = [56, 189, 248];   // sky-400
  const SKY_BOT = [14, 165, 233];   // sky-500
  const SUN = [251, 191, 36];       // sunny-400
  const SUN_CORE = [253, 224, 71];  // sunny-300

  for (let y = 0; y < size; y++) {
    // vertical sky gradient
    const t = y / size;
    const sky = [
      Math.round(SKY_TOP[0] + (SKY_BOT[0] - SKY_TOP[0]) * t),
      Math.round(SKY_TOP[1] + (SKY_BOT[1] - SKY_TOP[1]) * t),
      Math.round(SKY_TOP[2] + (SKY_BOT[2] - SKY_TOP[2]) * t),
    ];
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let color = sky;

      // sun rays (8 spokes)
      const ang = Math.atan2(dy, dx);
      const spoke = Math.cos(ang * 8);
      if (dist > rayInner && dist < rayOuter && spoke > 0.6) color = SUN;

      // sun disc
      if (dist < sunR) color = dist < sunR * 0.7 ? SUN_CORE : SUN;

      set(x, y, color);
    }
  }
  return buf;
}

for (const size of [180, 192, 512]) {
  const png = encodePng(size, draw(size));
  writeFileSync(join(OUT, `icon-${size}.png`), png);
  console.log(`wrote icons/icon-${size}.png (${png.length} bytes)`);
}
