#!/usr/bin/env node
// Packs the self-contained ChatGPT/Codex Plugin into a deterministic ZIP
// Use a host or submission flow that accepts Skills-only Plugin archives.
//   node scripts/package.mjs [out.zip]
//
// Pure Node: no zip binary, no Python. The archive holds one top-level folder
// named after the skill, with everything selftest.mjs needs to run from the
// extracted copy. Only the README screenshots (docs/) stay out.
// Entries are sorted and stamped with a fixed date, so the same sources always
// produce the same bytes.

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, basename, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../plugins/portfolio-interview');
const name = basename(root);
const out = resolve(process.argv[2] || join(process.cwd(), `${name}.zip`));

const EXCLUDE = new Set(['docs', 'node_modules', '.git']);
const SKIP_FILE = /(^|\/)(\.DS_Store|Thumbs\.db)$|\.zip$/;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const abs = join(dir, entry);
    const rel = relative(root, abs).split(sep).join('/');
    if (EXCLUDE.has(rel.split('/')[0])) return [];
    if (statSync(abs).isDirectory()) return walk(abs);
    return SKIP_FILE.test(rel) ? [] : [rel];
  });
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// 2026-01-01 00:00 in MS-DOS format, the same for every entry.
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

if (!existsSync(join(root, 'plugin.json'))) throw new Error('portable Plugin source not found');
const files = walk(root).sort();
const locals = [];
const centrals = [];
let offset = 0;

for (const rel of files) {
  const data = readFileSync(join(root, rel));
  const packed = deflateRawSync(data, { level: 9 });
  const useDeflate = packed.length < data.length;
  const body = useDeflate ? packed : data;
  const fileName = Buffer.from(`${name}/${rel}`, 'utf8');
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);              // version needed
  local.writeUInt16LE(0x0800, 6);          // UTF-8 names
  local.writeUInt16LE(useDeflate ? 8 : 0, 8);
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(fileName.length, 26);
  local.writeUInt16LE(0, 28);
  locals.push(local, fileName, body);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(0x031e, 4);        // made by: Unix, spec 3.0
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(useDeflate ? 8 : 0, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(body.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(fileName.length, 28);
  central.writeUInt32LE(((0o100644) << 16) >>> 0, 38); // -rw-r--r--
  central.writeUInt32LE(offset, 42);
  centrals.push(central, fileName);

  offset += local.length + fileName.length + body.length;
}

const centralDir = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralDir.length, 12);
end.writeUInt32LE(offset, 16);

writeFileSync(out, Buffer.concat([...locals, centralDir, end]));
console.log(`packed ${name} (${files.length} files) -> ${out}`);
