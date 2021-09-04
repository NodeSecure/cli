
export function formatBytes(bytes, decimals) {
  if (bytes === 0) {
    return "0 B";
  }
  const dm = decimals <= 0 ? 0 : decimals || 2;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const id = Math.floor(Math.log(bytes) / Math.log(1024));

  return parseFloat((bytes / Math.pow(1024, id)).toFixed(dm)) + " " + sizes[id];
}
