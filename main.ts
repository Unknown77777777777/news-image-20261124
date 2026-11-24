// THE TUESDAY GLOBE - one-page newspaper summary of world news,
// Tuesday 24 November 2026. Pure JavaScript, no dependencies.
// Writes a deterministic 1024x1024 PNG to MAKEFUN_OUTPUT_DIR (or /output, or ./out).
// No network, no clock, no randomness: two runs produce byte-identical output.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER = [247, 243, 232];
const INK = [17, 17, 17];
const RED = [139, 26, 26];
const GREY = [90, 86, 76];
const LIGHT = [232, 226, 210];

// ---------------------------------------------------------------- bitmap font (5x7, hand drawn)
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "#": ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  "@": ["01110", "10001", "10111", "10101", "10110", "10000", "01110"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
};

// ---------------------------------------------------------------- canvas
const px = Buffer.alloc(W * H * 3);
function fill(c) {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0]; px[i * 3 + 1] = c[1]; px[i * 3 + 2] = c[2];
  }
}
function setPixel(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, c);
}
function hline(x, y, w, c, t) {
  fillRect(x, y, w, t || 1, c);
}
function vline(x, y, h, c, t) {
  fillRect(x, y, t || 1, h, c);
}
function box(x, y, w, h, c, t) {
  const th = t || 1;
  hline(x, y, w, c, th); hline(x, y + h - th, w, c, th);
  vline(x, y, h, c, th); vline(x + w - th, y, h, c, th);
}

// ---------------------------------------------------------------- text
function glyph(ch) {
  const up = ch.toUpperCase();
  return FONT[up] || FONT["?"];
}
function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}
function drawText(x, y, s, scale, c) {
  let cx = x;
  for (const ch of s) {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++)
      for (let col = 0; col < 5; col++)
        if (g[r][col] === "1") fillRect(cx + col * scale, y + r * scale, scale, scale, c);
    cx += 6 * scale;
  }
  return cx;
}
function drawTextCentered(cx, y, s, scale, c) {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}
function wrapText(s, maxWidth, scale) {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxWidth) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(x, y, s, maxWidth, scale, c, lh) {
  const lines = wrapText(s, maxWidth, scale);
  const lineH = lh || 7 * scale + 4;
  for (let i = 0; i < lines.length; i++) drawText(x, y + i * lineH, lines[i], scale, c);
  return y + lines.length * lineH;
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG() {
  const raw = Buffer.alloc(H * (W * 3 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- layout
const M = 36;            // margin
const CW = W - 2 * M;    // content width = 952

fill(PAPER);

// top thin rules
hline(M, 26, CW, INK, 2);
hline(M, 31, CW, INK, 1);

// masthead
drawTextCentered(512, 44, "THE TUESDAY GLOBE", 8, INK);
drawTextCentered(512, 108, "TUESDAY 24 NOVEMBER 2026", 3, RED);
hline(M, 136, CW, INK, 3);
hline(M, 141, CW, INK, 1);
drawText(M, 150, "VOL. I - NO. 1", 2, GREY);
drawTextCentered(512, 150, "ONE WORLD. ONE PAGE. ALL THE NEWS THAT FITS.", 2, GREY);
drawText(952 - textWidth("LATE EDITION", 2), 150, "LATE EDITION", 2, GREY);

// ---- lead kicker + headline
drawText(M, 182, "WAR IN UKRAINE - NATO ALERT", 2, RED);
drawText(M, 206, "POLAND ON ALERT AS", 5, INK);
drawText(M, 244, "RUSSIAN DRONE CROSSES", 5, INK);
drawText(M, 282, "ITS BORDER OVERNIGHT", 5, INK);
hline(M, 322, CW, INK, 1);

// ---- lead body (left) + illustration (right)
const leadBody =
  "WARSAW - Poland activated air-defence assets overnight after a Russian " +
  "drone entered Polish airspace near Dorohusk during a fresh wave of Russian " +
  "strikes on Ukraine. Warsaw tracked the drone and put air-defence units on " +
  "alert in response, the latest spillover of the war onto NATO soil. Kyiv reported " +
  "new drone and missile strikes across its capital region in the same night.";
drawPara(M, 336, leadBody, 560, 2, INK, 17);

// illustration: radar screen with drone track
const ix = 620, iy = 336, iw = 332, ih = 128;
box(ix, iy, iw, ih, INK, 2);
fillRect(ix + 2, iy + 2, iw - 4, ih - 4, [22, 34, 22]);
// radar rings
function circle(cx, cy, r, c) {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180;
    setPixel(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
  }
}
const rc = [60, 160, 90];
circle(ix + 90, iy + 64, 52, rc);
circle(ix + 90, iy + 64, 36, rc);
circle(ix + 90, iy + 64, 18, rc);
hline(ix + 90 - 52, iy + 64, 105, rc, 1);
vline(ix + 90, iy + 64 - 52, 105, rc, 1);
// dashed flight path + drone dot
for (let d = 0; d < 12; d++) {
  const x0 = ix + 150 + d * 13, y0 = iy + 100 - d * 5;
  fillRect(x0, y0, 7, 2, [120, 220, 120]);
}
fillRect(ix + 296, iy + 38, 10, 6, [255, 80, 80]);
fillRect(ix + 298, iy + 30, 6, 3, [255, 80, 80]);
drawText(ix + 150, iy + 108, "DRONE TRACK: DOROHUSK", 1, [150, 220, 150]);
drawText(ix + 8, iy + 108, "POLISH AIRSPACE", 1, [150, 220, 150]);

hline(M, 480, CW, INK, 1);

// ---- row 2: two stories
const colW = 466;
const y2 = 496;
// story A: Indonesia
drawText(M, y2, "SEARCH GOES ON AFTER", 3, INK);
drawText(M, y2 + 24, "INDONESIA FACTORY BLAZE", 3, INK);
drawPara(M, y2 + 54,
  "CIKANDE - Rescuers kept digging through the ruins of a candy factory on " +
  "Tuesday after a weekend fire that killed at least 24 people. About 30 " +
  "workers are still missing, and DNA tests will be needed to identify many " +
  "of the dead. Officials say an air-conditioner short circuit may have " +
  "started the blaze.", colW, 2, INK, 17);
// story B: COP31
const xB = M + colW + 20;
vline(xB - 10, y2, 190, INK, 1);
drawText(xB, y2, "CLIMATE TALKS COLLAPSE", 3, INK);
drawText(xB, y2 + 24, "OVER FOSSIL FUELS", 3, INK);
drawPara(xB, y2 + 54,
  "COP31 climate talks in Antalya ended without a deal on Monday after " +
  "negotiations ran over into Sunday night. Countries split over fossil " +
  "fuels, finance for poorer nations and the pace of emission cuts, and " +
  "delegates left Turkiye with no cover decision adopted.", colW, 2, INK, 17);

hline(M, 700, CW, INK, 1);

// ---- row 3: two stories
const y3 = 716;
drawText(M, y3, "SOUTH AFRICANS VOTE AS", 3, INK);
drawText(M, y3 + 24, "POWER FAILURES TEST ANC", 3, INK);
drawPara(M, y3 + 54,
  "South Africans went to the polls on Tuesday with the " +
  "governing ANC under pressure over failing power and water services.", colW, 2, INK, 17);
vline(xB - 10, y3, 130, INK, 1);
drawText(xB, y3, "KENYA LANDS 293,600", 3, INK);
drawText(xB, y3 + 24, "JOBS IN SAUDI ARABIA", 3, INK);
drawPara(xB, y3 + 54,
  "NAIROBI - Kenya said it had secured 293,600 job opportunities in Saudi " +
  "Arabia, though unions asked whether workers can count on fair pay and " +
  "protection abroad.", colW, 2, INK, 17);

hline(M, 856, CW, INK, 1);

// ---- IN BRIEF band
const y4 = 872;
fillRect(M, y4, CW, 118, LIGHT);
box(M, y4, CW, 118, INK, 2);
drawText(M + 12, y4 + 10, "IN BRIEF", 3, RED);
const briefs = [
  "EU PROPOSES 22ND SANCTIONS PACKAGE AGAINST RUSSIA, TARGETING BANKS AND CRYPTO PLATFORMS. (MONDAY)",
  "NVIDIA REINSTATED JENSEN HUANG AS CHIEF EXECUTIVE ON MONDAY, 11 DAYS AFTER HE RESIGNED; SHARES JUMPED ABOUT 30%.",
  "UKRAINIAN DRONE STRIKE SET A RUSSIAN OIL REFINERY AT NOVOSHAKHTINSK ABLAZE, REPORTS SAID.",
  "RUSSIAN WAR DEATHS LIKELY NEAR 700,000, MEDIA REPORTED AFTER STUDYING LEAKED GOVERNMENT DATA.",
  "FIRST TEST BETWEEN INDIA AND NEW ZEALAND IN WELLINGTON ENDED IN A DRAW.",
  "KENYA DISCHARGED ITS LAST EBOLA PATIENT AS THE DEATH TOLL IN DR CONGO PASSED 5,300.",
  "DR CONGO PRESIDENT ENACTS LAW FOR CONSTITUTIONAL REFORM AMID HIGH TENSIONS.",
];
let by = y4 + 34;
for (const b of briefs) {
  const lines = wrapText("* " + b, CW - 24, 1);
  for (const ln of lines) {
    drawText(M + 12, by, ln, 1, INK);
    by += 11;
  }
}

// ---- footer
hline(M, 1004, CW, INK, 1);
drawTextCentered(512, 1012, "ALL STORIES REPORTED ON TUESDAY 24 NOVEMBER 2026 - THE TUESDAY GLOBE", 1, GREY);

// ---------------------------------------------------------------- write out
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const fallback = path.join(process.cwd(), "out");
let dir = outDir;
try {
  fs.mkdirSync(dir, { recursive: true });
} catch (e) {
  dir = fallback;
  fs.mkdirSync(dir, { recursive: true });
}
const outPath = path.join(dir, "entry.png");
fs.writeFileSync(outPath, encodePNG());
console.log("wrote " + outPath);
