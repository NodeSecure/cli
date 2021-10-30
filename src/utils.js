// CONSTANTS
const kBytesSize = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

export function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 B";
  }
  const id = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = parseFloat((bytes / Math.pow(1024, id)).toFixed(2));

  return `${size} ${kBytesSize[id]}`;
}

export function locationToString(location) {
  const start = `${location[0][0]}:${location[0][1]}`;
  const end = `${location[1][0]}:${location[1][1]}`;

  return `[${start}] - [${end}]`;
}
