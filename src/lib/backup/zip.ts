type ZipEntry = { name: string; data: Uint8Array; modifiedAt?: Date };

const encoder = new TextEncoder();

function bytes16(value: number) {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
}

function bytes32(value: number) {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function join(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  parts.forEach((part) => { output.set(part, offset); offset += part.length; });
  return output;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getSeconds() >>> 1) | (date.getMinutes() << 5) | (date.getHours() << 11),
    date: date.getDate() | ((date.getMonth() + 1) << 5) | ((year - 1980) << 9),
  };
}

/** Creates a standard, uncompressed UTF-8 ZIP archive without adding a runtime dependency. */
export function createZip(entries: ZipEntry[]) {
  const localFiles: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const name = encoder.encode(entry.name);
    const { time, date } = dosDateTime(entry.modifiedAt ?? new Date());
    const checksum = crc32(entry.data);
    const localHeader = join([
      bytes32(0x04034b50), bytes16(20), bytes16(0x0800), bytes16(0), bytes16(time), bytes16(date),
      bytes32(checksum), bytes32(entry.data.length), bytes32(entry.data.length), bytes16(name.length), bytes16(0), name,
    ]);
    localFiles.push(localHeader, entry.data);
    directory.push(join([
      bytes32(0x02014b50), bytes16(20), bytes16(20), bytes16(0x0800), bytes16(0), bytes16(time), bytes16(date),
      bytes32(checksum), bytes32(entry.data.length), bytes32(entry.data.length), bytes16(name.length), bytes16(0), bytes16(0),
      bytes16(0), bytes16(0), bytes32(0), bytes32(offset), name,
    ]));
    offset += localHeader.length + entry.data.length;
  });

  const directoryBytes = join(directory);
  return join([
    ...localFiles,
    directoryBytes,
    bytes32(0x06054b50), bytes16(0), bytes16(0), bytes16(entries.length), bytes16(entries.length),
    bytes32(directoryBytes.length), bytes32(offset), bytes16(0),
  ]);
}
