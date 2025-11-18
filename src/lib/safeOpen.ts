export function safeOpen(url: string, name = '_blank') {
  const w = window.open(url, name);
  try {
    if (w) w.opener = null;
  } catch (e) {
    // ignore
  }
  return w;
}
