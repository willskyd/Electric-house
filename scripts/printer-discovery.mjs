import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function parseConnectedRfcomm(output) {
  const printers = [];
  const linePattern = /^rfcomm(\d+):\s+([0-9a-f]{2}(?::[0-9a-f]{2}){5})\s+->\s+([0-9a-f]{2}(?::[0-9a-f]{2}){5})\s+channel\s+(\d+)\s+connected\b/im;
  for (const line of String(output).split(/\r?\n/)) {
    const match = linePattern.exec(line);
    if (!match) continue;
    const number = Number(match[1]);
    printers.push({
      id: `rfcomm-${number}`,
      device: `/dev/rfcomm${number}`,
      localAddress: match[2].toUpperCase(),
      address: match[3].toUpperCase(),
      channel: Number(match[4]),
    });
  }
  return printers.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export async function discoverConnectedPrinters() {
  const { stdout } = await execFileAsync('rfcomm', ['-a'], { timeout: 3000, maxBuffer: 64 * 1024 });
  const discovered = parseConnectedRfcomm(stdout);
  const connected = [];
  for (const printer of discovered) {
    try {
      const info = await fs.stat(printer.device);
      if (!info.isCharacterDevice()) continue;
      await fs.access(printer.device, constants.W_OK);
      connected.push(printer);
    } catch {
      // Ignore stale RFCOMM entries and devices this user cannot write to.
    }
  }
  return connected;
}
