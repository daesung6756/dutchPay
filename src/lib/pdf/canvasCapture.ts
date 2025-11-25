"use client";

export async function captureElementWithHtml2Canvas(target: HTMLElement, options: any = {}) {
  const html2canvasMod = await import('html2canvas');
  const html2canvas = (html2canvasMod && (html2canvasMod as any).default) || html2canvasMod;
  const canvas = await html2canvas(target as HTMLElement, options);
  return canvas as HTMLCanvasElement;
}

export default captureElementWithHtml2Canvas;
