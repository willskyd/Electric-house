import assert from 'node:assert/strict';
import test from 'node:test';
import { parseConnectedRfcomm } from './printer-discovery.mjs';

test('finds every connected RFCOMM device and ignores disconnected devices', () => {
  const parsed = parseConnectedRfcomm([
    'rfcomm0: E8:6F:38:39:38:5A -> 86:67:7A:92:30:AE channel 1 connected [reuse-dlc release-on-hup tty-attached]',
    'rfcomm1: E8:6F:38:39:38:5A -> 22:33:44:55:66:77 channel 2 connected [tty-attached]',
    'rfcomm2: E8:6F:38:39:38:5A -> AA:BB:CC:DD:EE:FF channel 1 disconnected',
    'not a device line',
  ].join('\n'));
  assert.deepEqual(parsed.map((printer) => printer.device), ['/dev/rfcomm0', '/dev/rfcomm1']);
  assert.equal(parsed[0].address, '86:67:7A:92:30:AE');
  assert.equal(parsed[1].channel, 2);
});
